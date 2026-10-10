function parse(raw: any) {
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export function shouldRun(
  triggerTypename: string | undefined,
  zapRunDetails: any
): { ok: boolean; reason?: string } {
  const metadata = parse(zapRunDetails?.metadata);

  // GitHub issue (security) trigger
  if (triggerTypename === "github-issue(security)") {
    // JSON webhook: issue is directly in metadata.
    // Form-encoded webhook: JSON is inside metadata.payload.
    const payload =
      typeof metadata?.payload === "string"
        ? JSON.parse(metadata.payload)
        : metadata?.payload ?? metadata;

    if (!payload?.issue) {
      return { ok: false, reason: "no issue in payload (maybe a GitHub ping)" };
    }

    const action = payload.action;
    if (action !== "opened" && action !== "edited") {
      return { ok: false, reason: `issue action '${action}' is ignored` };
    }

    const title = String(payload.issue.title ?? "").toLowerCase();
    const body = String(payload.issue.body ?? "").toLowerCase();
    if (!title.includes("security") && !body.includes("security")) {
      return { ok: false, reason: "issue does not contain 'security'" };
    }
  }

  // GitHub open-source PR trigger
  if (triggerTypename === "gitHub-opensource(pr)") {
    if (!metadata?.pull_request) {
      return { ok: false, reason: "payload is not a Pull Request (maybe a ping)" };
    }

    const senderLogin = metadata?.sender?.login;
    const repoOwner = metadata?.repository?.owner?.login;
    if (senderLogin && senderLogin === repoOwner) {
      return { ok: false, reason: "PR was opened by the repository owner" };
    }
  }

  return { ok: true };
}