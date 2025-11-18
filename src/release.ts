import * as github from '@actions/github';
import * as exec from '@actions/exec';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from './utils/logger';
import { PackagedPackage } from './types/manifest';

/**
 * GitHub Release Management
 * Creates individual releases for each plugin version
 * Each release tag points to the current commit
 */

export interface ReleaseOptions {
  packages: PackagedPackage[];
  githubToken: string;
  repository: string; // format: "owner/repo"
  forceRelease?: boolean; // Delete existing releases and tags before creating new ones
  ociRegistry?: string; // OCI registry URL (e.g., ghcr.io/username)
}

export interface ReleaseResult {
  createdReleases: string[];
  skippedReleases: string[];
  deletedReleases: string[];
}

export async function createPluginReleases(options: ReleaseOptions): Promise<ReleaseResult> {
  logger.header('Creating GitHub Releases for Plugins');

  const { packages, githubToken, repository, forceRelease = false, ociRegistry } = options;

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid repository format: ${repository}. Expected: owner/repo`);
  }

  const octokit = github.getOctokit(githubToken);

  const createdReleases: string[] = [];
  const skippedReleases: string[] = [];
  const deletedReleases: string[] = [];

  // Get current git remote URL
  const remoteUrl = `https://x-access-token:${githubToken}@github.com/${owner}/${repo}.git`;

  for (const pkg of packages) {
    const tagName = `package_${pkg.name}_${pkg.version}`;
    const releaseName = `${pkg.name} v${pkg.version}`;

    logger.startGroup(`Processing: ${tagName}`);

    try {
      // Check if tag already exists
      const tagExists = await checkTagExists(octokit, owner, repo, tagName);

      if (tagExists) {
        if (forceRelease) {
          // Delete existing release and tag
          logger.warning(`Tag ${tagName} already exists, deleting due to force-release`);
          await deleteExistingRelease(octokit, owner, repo, tagName, remoteUrl);
          deletedReleases.push(tagName);
        } else {
          logger.warning(`Tag ${tagName} already exists, skipping`);
          skippedReleases.push(tagName);
          logger.endGroup();
          continue;
        }
      }

      // Create git tag on current commit
      logger.info(`Creating tag: ${tagName}`);
      await exec.exec('git', ['tag', tagName]);
      await exec.exec('git', ['push', remoteUrl, tagName]);
      logger.success(`✅ Tag ${tagName} created and pushed`);

      // Read package file for release asset
      const packageFileName = path.basename(pkg.archivePath);
      const packageContent = await fs.readFile(pkg.archivePath);

      logger.info(`Creating GitHub release: ${tagName}`);

      // Create release
      const release = await octokit.rest.repos.createRelease({
        owner,
        repo,
        tag_name: tagName,
        name: releaseName,
        body: await generateReleaseNotes(pkg, owner, repo, tagName, ociRegistry),
        draft: false,
        prerelease: false,
      });

      logger.info(`Release created: ${release.data.html_url}`);

      // Upload package asset
      await octokit.rest.repos.uploadReleaseAsset({
        owner,
        repo,
        release_id: release.data.id,
        name: packageFileName,
        data: packageContent as unknown as string,
      });

      logger.success(`✅ Release created: ${tagName}`);
      logger.info(`   URL: ${release.data.html_url}`);
      createdReleases.push(tagName);
    } catch (error) {
      logger.error(
        `Failed to create release for ${tagName}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    } finally {
      logger.endGroup();
    }
  }

  // Summary
  logger.header('Release Creation Summary');
  logger.info(`Releases created: ${createdReleases.length}`);
  logger.info(`Releases skipped: ${skippedReleases.length}`);
  logger.info(`Releases deleted: ${deletedReleases.length}`);
  logger.info(`Total processed: ${packages.length}`);

  if (deletedReleases.length > 0) {
    logger.warning('Deleted releases (force-release):');
    for (const tag of deletedReleases) {
      logger.info(`  - ${tag}`);
    }
  }

  if (createdReleases.length > 0) {
    logger.success('Created releases:');
    for (const tag of createdReleases) {
      logger.info(`  - ${tag}`);
    }
  }

  if (skippedReleases.length > 0) {
    logger.info('Skipped releases (already exist):');
    for (const tag of skippedReleases) {
      logger.info(`  - ${tag}`);
    }
  }

  return { createdReleases, skippedReleases, deletedReleases };
}

async function checkTagExists(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  tagName: string
): Promise<boolean> {
  try {
    await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `tags/${tagName}`,
    });
    return true;
  } catch (error) {
    // If error is 404, tag doesn't exist
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return false;
    }
    // Re-throw other errors
    throw error;
  }
}

async function deleteExistingRelease(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  tagName: string,
  remoteUrl: string
): Promise<void> {
  try {
    // 1. Try to find and delete the GitHub release
    try {
      const release = await octokit.rest.repos.getReleaseByTag({
        owner,
        repo,
        tag: tagName,
      });

      logger.info(`  Deleting GitHub release: ${tagName}`);
      await octokit.rest.repos.deleteRelease({
        owner,
        repo,
        release_id: release.data.id,
      });
      logger.success(`  ✅ GitHub release deleted`);
    } catch (error) {
      // If release doesn't exist (404), that's fine
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        logger.info(`  No GitHub release found for ${tagName}`);
      } else {
        throw error;
      }
    }

    // 2. Delete the git tag locally (if exists)
    logger.info(`  Deleting local tag: ${tagName}`);
    try {
      await exec.exec('git', ['tag', '-d', tagName], { ignoreReturnCode: true });
    } catch {
      // Ignore errors - tag might not exist locally
    }

    // 3. Delete the git tag from remote
    logger.info(`  Deleting remote tag: ${tagName}`);
    try {
      await exec.exec('git', ['push', remoteUrl, `:refs/tags/${tagName}`], {
        ignoreReturnCode: true,
      });
      logger.success(`  ✅ Remote tag deleted`);
    } catch (error) {
      logger.warning(`  Failed to delete remote tag (may not exist): ${tagName}`);
    }
  } catch (error) {
    logger.error(
      `Failed to delete release ${tagName}: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

/**
 * Generate OCI installation methods documentation
 * @param pkg - Package information
 * @param ociRegistry - OCI registry URL
 * @returns Markdown string with OCI installation methods
 * @remarks Currently unused - will be enabled when Command Launcher adds OCI support
 * @internal Reserved for future use when Command Launcher supports OCI registries
 */
export function generateOciInstallationMethods(pkg: PackagedPackage, ociRegistry: string): string {
  const safeName = pkg.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const ociRef = `${ociRegistry}/${safeName}`;
  const ociUrl = `oci://${ociRef}:${pkg.version}`;
  const ociLatestUrl = `oci://${ociRef}:latest`;

  return `
### Method 3: OCI Registry (Pinned Version)

> **Note:** OCI registry support will be added in future versions of Command Launcher.

Add the following record to your Command Launcher remote registry's \`index.json\` file:

\`\`\`json
{
  "name": "${pkg.name}",
  "version": "${pkg.version}",
  "url": "${ociUrl}",
  "startPartition": 0,
  "endPartition": 9
}
\`\`\`

### Method 4: OCI Registry (Auto-update to Latest)

> **Note:** OCI registry support will be added in future versions of Command Launcher.

Add the following record to your Command Launcher remote registry's \`index.json\` file (without version tag for automatic updates):

\`\`\`json
{
  "name": "${pkg.name}",
  "url": "${ociLatestUrl}",
  "startPartition": 0,
  "endPartition": 9
}
\`\`\`

This will automatically fetch the latest version of the plugin.`;
}

async function generateReleaseNotes(
  pkg: PackagedPackage,
  owner: string,
  repo: string,
  tagName: string,
  ociRegistry?: string // Reserved for future OCI support in Command Launcher
): Promise<string> {
  // Read manifest from source directory
  const yaml = await import('yaml');
  const manifestPath = path.join(pkg.sourceDirectory, 'manifest.mf');
  const manifestContent = await fs.readFile(manifestPath, 'utf-8');
  const manifest = yaml.parse(manifestContent);

  // Suppress unused variable warning - ociRegistry is reserved for future use
  void ociRegistry;

  // Read README if exists
  let readmeContent = '';
  const readmePath = path.join(pkg.sourceDirectory, 'README.md');
  try {
    readmeContent = await fs.readFile(readmePath, 'utf-8');
  } catch {
    // README doesn't exist, skip it
  }

  // Calculate SHA256 checksum
  const crypto = await import('crypto');
  const fileBuffer = await fs.readFile(pkg.archivePath);
  const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Construct download URL
  const packageFileName = `${pkg.name}-${pkg.version}.pkg`;
  const downloadUrl = `https://github.com/${owner}/${repo}/releases/download/${tagName}/${packageFileName}`;

  // Build plugin overview section
  let overviewSection = '';

  if (manifest._metadata) {
    const metadata = manifest._metadata;
    overviewSection += '## 📋 Plugin Information\n\n';

    if (metadata.author) {
      overviewSection += `- **Author:** ${metadata.author}\n`;
    }
    if (metadata.homepage) {
      overviewSection += `- **Homepage:** ${metadata.homepage}\n`;
    }
    if (metadata.repository) {
      overviewSection += `- **Repository:** ${metadata.repository}\n`;
    }
    if (metadata.license) {
      overviewSection += `- **License:** ${metadata.license}\n`;
    }
    if (metadata.tags && metadata.tags.length > 0) {
      overviewSection += `- **Tags:** ${metadata.tags.join(', ')}\n`;
    }
    overviewSection += '\n';
  }

  // Build commands section
  let commandsSection = '## 📚 Commands\n\n';

  if (manifest.cmds && manifest.cmds.length > 0) {
    for (const cmd of manifest.cmds) {
      commandsSection += `### \`${cmd.name}\`\n\n`;

      if (cmd.short) {
        commandsSection += `${cmd.short}\n\n`;
      }

      if (cmd.long) {
        commandsSection += `${cmd.long}\n\n`;
      }

      commandsSection += `- **Type:** ${cmd.type}\n`;

      if (cmd.group) {
        commandsSection += `- **Group:** ${cmd.group}\n`;
      }

      if (cmd.executable) {
        commandsSection += `- **Executable:** \`${cmd.executable}\`\n`;
      }

      if (cmd.flags && cmd.flags.length > 0) {
        commandsSection += '\n**Flags:**\n\n';
        for (const flag of cmd.flags) {
          const shortFlag = flag.short ? `, \`-${flag.short}\`` : '';
          const required = flag.required ? ' (required)' : '';
          const defaultValue = flag.default !== undefined ? ` (default: \`${flag.default}\`)` : '';

          commandsSection += `- \`--${flag.name}\`${shortFlag} - ${flag.desc || flag.description || 'No description'}${required}${defaultValue}\n`;
          commandsSection += `  - Type: \`${flag.type}\`\n`;
        }
      }

      commandsSection += '\n';
    }
  } else {
    commandsSection += 'No commands defined.\n\n';
  }

  // Add README content if exists
  let readmeSection = '';
  if (readmeContent) {
    readmeSection = `## 📖 Documentation\n\n${readmeContent}\n\n`;
  }

  const installationSection = `## 📦 Installation

### Method 1: Command Line (Direct Install)

Install directly using Command Launcher CLI:

\`\`\`bash
<command_launcher_cli> package install --file ${downloadUrl}
\`\`\`

If your CLI is named \`cdt\`:

\`\`\`bash
cdt package install --file ${downloadUrl}
\`\`\`

### Method 2: Command Launcher Remote Registry (Pinned Version)

Add the following record to your Command Launcher remote registry's \`index.json\` file:

\`\`\`json
{
  "name": "${pkg.name}",
  "version": "${pkg.version}",
  "checksum": "${checksum}",
  "url": "${downloadUrl}",
  "startPartition": 0,
  "endPartition": 9
}
\`\`\``;

  // OCI installation methods - commented out as OCI is not yet supported in Command Launcher
  // Uncomment when Command Launcher adds OCI registry support
  // if (ociRegistry) {
  //   installationSection += generateOciInstallationMethods(pkg, ociRegistry);
  // }

  return `# ${pkg.name} v${pkg.version}

${overviewSection}${commandsSection}${readmeSection}${installationSection}

## 📄 Package Information

- **Name:** ${pkg.name}
- **Version:** ${pkg.version}
- **Size:** ${formatBytes(pkg.size)}
- **SHA256:** \`${checksum}\`
- **Download URL:** ${downloadUrl}

---

🤖 *Generated automatically by [Command Launcher Package Action](https://github.com/mazurov/command-launcher-package-action)*
`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
