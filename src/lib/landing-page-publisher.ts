import { access, copyFile, mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';
import {
  Block,
  buildStaticPageCss,
  buildStaticPageDocument,
  buildStaticPageHtaccess,
  buildStaticPageScript,
  buildStoredHtml,
  renderBlocksToHtml,
  sanitizeSlug,
} from '@/lib/landing-page-renderer';
import { buildAnalyticsSnippets, parseLandingPageAnalytics } from '@/lib/landing-page-analytics';

const execFileAsync = promisify(execFile);

type DeployStatus = 'deployed' | 'skipped' | 'failed';

export type PublishLandingPageInput = {
  title: string;
  slug: string;
  blocks: Block[];
  analyticsJson?: string | null;
};

export type PublishLandingPageResult = {
  slug: string;
  outputDir: string;
  htmlData: string;
  deployStatus: DeployStatus;
  deployMessage: string;
  exportedFiles: string[];
  remotePath: string | null;
};

async function pathExists(targetPath: string) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findCommand(command: string) {
  if (process.platform !== 'win32') {
    return command;
  }

  const candidates = [`${command}.exe`, `${command}.cmd`, command];

  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate, ['-V'], { windowsHide: true, timeout: 5000 });
      return candidate;
    } catch {
      try {
        await execFileAsync(candidate, ['-v'], { windowsHide: true, timeout: 5000 });
        return candidate;
      } catch {
        try {
          await execFileAsync(candidate, [], { windowsHide: true, timeout: 5000 });
          return candidate;
        } catch {
          continue;
        }
      }
    }
  }

  return null;
}

function buildSshOptions({
  useKeyAuth,
  sshKeyPath,
  usePasswordAuth,
}: {
  useKeyAuth: boolean;
  sshKeyPath?: string;
  usePasswordAuth: boolean;
}) {
  const args = ['-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null'];

  if (usePasswordAuth) {
    args.push(
      '-o',
      'PreferredAuthentications=password',
      '-o',
      'PubkeyAuthentication=no',
      '-o',
      'BatchMode=no',
      '-o',
      'NumberOfPasswordPrompts=1'
    );
  }

  if (useKeyAuth && sshKeyPath) {
    args.push('-i', sshKeyPath);
  }

  return args;
}

function buildRemoteSlugPath(basePath: string, slug: string) {
  const safeSlug = sanitizeSlug(slug);
  const normalizedBase = basePath.replace(/\\/g, '/').replace(/\/+$/, '');

  if (!normalizedBase) {
    throw new Error('DEPLOY_PATH kosong.');
  }

  return `${normalizedBase}/${safeSlug}`;
}

async function localizeAssets(blocks: Block[], assetsDir: string) {
  const copiedNames = new Map<string, string>();

  await mkdir(assetsDir, { recursive: true });

  const nextBlocks: Block[] = [];

  for (const block of blocks) {
    if (block.type !== 'image' || !block.content.src) {
      nextBlocks.push(block);
      continue;
    }

    const src = block.content.src;

    if (!src.startsWith('/')) {
      nextBlocks.push(block);
      continue;
    }

    const sourceFile = path.join(process.cwd(), 'public', src.replace(/^\/+/, '').replace(/\//g, path.sep));
    const exists = await pathExists(sourceFile);

    if (!exists) {
      nextBlocks.push(block);
      continue;
    }

    const ext = path.extname(sourceFile) || '.bin';
    const basename = path.basename(sourceFile, ext);
    const currentCount = copiedNames.size + 1;
    const localName = `${String(currentCount).padStart(2, '0')}-${sanitizeSlug(basename) || 'asset'}${ext}`;
    const targetFile = path.join(assetsDir, localName);

    if (!copiedNames.has(sourceFile)) {
      await copyFile(sourceFile, targetFile);
      copiedNames.set(sourceFile, localName);
    }

    nextBlocks.push({
      ...block,
      content: {
        ...block.content,
        src: `./assets/${copiedNames.get(sourceFile)}`,
      },
    });
  }

  return nextBlocks;
}

async function deployWithSftp({
  localDir,
  slug,
}: {
  localDir: string;
  slug: string;
}) {
  const host = process.env.DEPLOY_HOST;
  const port = process.env.DEPLOY_PORT || '22';
  const username = process.env.DEPLOY_USERNAME;
  const password = process.env.DEPLOY_PASSWORD;
  const basePath = process.env.DEPLOY_PATH;
  const sshKeyPath = process.env.DEPLOY_SSH_KEY_PATH;

  if (!host || !username || !basePath) {
    return {
      status: 'skipped' as const,
      message: 'Bundle berhasil dibuat lokal, tapi env deploy belum lengkap.',
      remotePath: null,
    };
  }

  const remotePath = buildRemoteSlugPath(basePath, slug);
  const sshCommand = await findCommand('ssh');
  const sftpCommand = await findCommand('sftp');
  const scpCommand = await findCommand('scp');

  if (!sshCommand || (!sftpCommand && !scpCommand)) {
    return {
      status: 'failed' as const,
      message: 'Command ssh dan metode upload (scp/sftp) tidak tersedia di server builder.',
      remotePath,
    };
  }

  const useKeyAuth = !!sshKeyPath;
  const usePasswordAuth = !!password;

  if (!useKeyAuth && !usePasswordAuth) {
    return {
      status: 'skipped' as const,
      message: 'Env deploy ada, tapi butuh DEPLOY_SSH_KEY_PATH atau DEPLOY_PASSWORD.',
      remotePath,
    };
  }

  const sshpassCommand = usePasswordAuth ? await findCommand('sshpass') : null;

  if (usePasswordAuth && !sshpassCommand && !useKeyAuth) {
    return {
      status: 'skipped' as const,
      message: 'DEPLOY_PASSWORD terisi, tapi sshpass tidak tersedia. Gunakan SSH key atau install sshpass.',
      remotePath,
    };
  }

  const commonSshOptions = buildSshOptions({ useKeyAuth, sshKeyPath, usePasswordAuth });
  const sshArgs = ['-p', port, ...commonSshOptions];
  sshArgs.push(`${username}@${host}`, `mkdir -p "${remotePath}"`);

  const normalizedLocalDir = localDir.replace(/\\/g, '/');

  try {
    if (usePasswordAuth && sshpassCommand) {
      await execFileAsync(
        sshpassCommand,
        ['-p', password!, sshCommand, ...sshArgs],
        { windowsHide: true, timeout: 30000 }
      );

      if (scpCommand && process.platform !== 'win32') {
        const scpArgs = ['-P', port, ...commonSshOptions, '-r', `${normalizedLocalDir}/.`, `${username}@${host}:${remotePath}/`];

        await execFileAsync(
          sshpassCommand,
          ['-p', password!, scpCommand, ...scpArgs],
          { windowsHide: true, timeout: 60000 }
        );
      } else if (sftpCommand) {
        const tempDir = path.join(process.cwd(), '.tmp', 'lp-publish');
        await mkdir(tempDir, { recursive: true });

        const sftpBatchFile = path.join(tempDir, `sftp-${sanitizeSlug(slug)}-${Date.now()}.txt`);
        const batchContent = [
          `mkdir "${remotePath}/assets"`,
          `put "${normalizedLocalDir}/index.php" "${remotePath}/index.php"`,
          `put "${normalizedLocalDir}/style.css" "${remotePath}/style.css"`,
          `put "${normalizedLocalDir}/script.js" "${remotePath}/script.js"`,
          `put "${normalizedLocalDir}/manifest.json" "${remotePath}/manifest.json"`,
          `put "${normalizedLocalDir}/.htaccess" "${remotePath}/.htaccess"`,
        ];

        const assetsLocalDir = path.join(localDir, 'assets');
        if (await pathExists(assetsLocalDir)) {
          batchContent.push(`put -r "${assetsLocalDir.replace(/\\/g, '/')}" "${remotePath}/assets"`);
        }

        await writeFile(sftpBatchFile, `${batchContent.join('\n')}\n`, 'utf8');

        const sftpArgs = ['-P', port, ...commonSshOptions, '-b', sftpBatchFile, `${username}@${host}`];

        await execFileAsync(
          sshpassCommand,
          ['-p', password!, sftpCommand, ...sftpArgs],
          { windowsHide: true, timeout: 60000 }
        );
      } else {
        throw new Error('Tidak ada command upload yang tersedia.');
      }
    } else {
      await execFileAsync(sshCommand, sshArgs, { windowsHide: true, timeout: 30000 });

      if (scpCommand && process.platform !== 'win32') {
        const scpArgs = ['-P', port, ...commonSshOptions, '-r', `${normalizedLocalDir}/.`, `${username}@${host}:${remotePath}/`];
        await execFileAsync(scpCommand, scpArgs, { windowsHide: true, timeout: 60000 });
      } else if (sftpCommand) {
        const tempDir = path.join(process.cwd(), '.tmp', 'lp-publish');
        await mkdir(tempDir, { recursive: true });

        const sftpBatchFile = path.join(tempDir, `sftp-${sanitizeSlug(slug)}-${Date.now()}.txt`);
        const batchContent = [
          `mkdir "${remotePath}/assets"`,
          `put "${normalizedLocalDir}/index.php" "${remotePath}/index.php"`,
          `put "${normalizedLocalDir}/style.css" "${remotePath}/style.css"`,
          `put "${normalizedLocalDir}/script.js" "${remotePath}/script.js"`,
          `put "${normalizedLocalDir}/manifest.json" "${remotePath}/manifest.json"`,
          `put "${normalizedLocalDir}/.htaccess" "${remotePath}/.htaccess"`,
        ];

        const assetsLocalDir = path.join(localDir, 'assets');
        if (await pathExists(assetsLocalDir)) {
          batchContent.push(`put -r "${assetsLocalDir.replace(/\\/g, '/')}" "${remotePath}/assets"`);
        }

        await writeFile(sftpBatchFile, `${batchContent.join('\n')}\n`, 'utf8');

        const sftpArgs = ['-P', port, ...commonSshOptions, '-b', sftpBatchFile, `${username}@${host}`];
        await execFileAsync(sftpCommand, sftpArgs, { windowsHide: true, timeout: 60000 });
      } else {
        throw new Error('Tidak ada command upload yang tersedia.');
      }
    }

    return {
      status: 'deployed' as const,
      message: `Bundle berhasil di-upload ke ${remotePath}.`,
      remotePath,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Deploy SFTP gagal.';
    const stderr =
      typeof error === 'object' &&
      error !== null &&
      'stderr' in error &&
      typeof (error as { stderr?: unknown }).stderr === 'string'
        ? (error as { stderr: string }).stderr
        : null;

    return {
      status: 'failed' as const,
      message: stderr || message,
      remotePath,
    };
  }
}

export async function publishLandingPageBundle({
  title,
  slug,
  blocks,
  analyticsJson,
}: PublishLandingPageInput): Promise<PublishLandingPageResult> {
  const safeSlug = sanitizeSlug(slug);
  if (!safeSlug) {
    throw new Error('Slug tidak valid untuk publish.');
  }

  const outputDir = path.join(process.cwd(), 'published-sites', safeSlug);
  const assetsDir = path.join(outputDir, 'assets');

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(assetsDir, { recursive: true });

  const localizedBlocks = await localizeAssets(blocks, assetsDir);
  const bodyHtml = renderBlocksToHtml(localizedBlocks);
  const htmlData = buildStoredHtml(blocks);
  const analyticsSnippets = buildAnalyticsSnippets(parseLandingPageAnalytics(analyticsJson || null));

  await writeFile(
    path.join(outputDir, 'index.php'),
    buildStaticPageDocument({
      title,
      bodyHtml,
      headExtras: analyticsSnippets.headHtml,
      bodyEndExtras: analyticsSnippets.bodyHtml,
    }),
    'utf8'
  );
  await writeFile(path.join(outputDir, 'style.css'), buildStaticPageCss(), 'utf8');
  await writeFile(path.join(outputDir, 'script.js'), buildStaticPageScript(), 'utf8');
  await writeFile(path.join(outputDir, '.htaccess'), buildStaticPageHtaccess(), 'utf8');
  await writeFile(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(
      {
        title,
        slug: safeSlug,
        generated_at: new Date().toISOString(),
        blocks_count: blocks.length,
      },
      null,
      2
    ),
    'utf8'
  );

  const deployResult = await deployWithSftp({ localDir: outputDir, slug: safeSlug });

  return {
    slug: safeSlug,
    outputDir,
    htmlData,
    deployStatus: deployResult.status,
    deployMessage: deployResult.message,
    exportedFiles: ['index.php', '.htaccess', 'style.css', 'script.js', 'manifest.json', 'assets/'],
    remotePath: deployResult.remotePath,
  };
}
