interface BuildInfo {
  commit: string;
  builtAt: string;
}

const currentBuildCommit = __BUILD_COMMIT__;

const getBuildInfoUrl = () => {
  const url = new URL('build-info.json', new URL(import.meta.env.BASE_URL, window.location.href));
  url.searchParams.set('t', String(Date.now()));
  return url;
};

export const hasNewBuild = async (): Promise<boolean> => {
  if (currentBuildCommit === 'development') return false;

  try {
    const response = await fetch(getBuildInfoUrl(), { cache: 'no-store' });
    if (!response.ok) return false;

    const buildInfo = (await response.json()) as Partial<BuildInfo>;
    return typeof buildInfo.commit === 'string' &&
      buildInfo.commit.length > 0 &&
      buildInfo.commit !== currentBuildCommit;
  } catch {
    return false;
  }
};
