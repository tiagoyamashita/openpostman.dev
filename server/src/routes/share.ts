import { Router } from "express";
import { requireAuth } from "../auth.js";
import {
  ensureOpenpostmanRepo,
  inviteOpenpostmanCollaborator,
  OPENPOSTMAN_REPO_NAME,
  openpostmanHtmlUrl,
} from "../github-repo.js";

const router = Router();

router.get("/share", requireAuth, async (req, res) => {
  const user = req.session.user!;
  try {
    await ensureOpenpostmanRepo(user.accessToken, user.login);
    res.json({
      owner: user.login,
      repo: OPENPOSTMAN_REPO_NAME,
      htmlUrl: openpostmanHtmlUrl(user.login),
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({
      error: err instanceof Error ? err.message : "Failed to prepare share link",
    });
  }
});

router.post("/share", requireAuth, async (req, res) => {
  const user = req.session.user!;
  const username = typeof req.body?.username === "string" ? req.body.username : "";
  try {
    const result = await inviteOpenpostmanCollaborator(user.accessToken, user.login, username);
    res.json({
      ok: true,
      htmlUrl: openpostmanHtmlUrl(user.login),
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to invite collaborator";
    const status = message.startsWith("Enter a valid") || message.startsWith("That account")
      ? 400
      : 502;
    if (status === 502) {
      console.error(err);
    }
    res.status(status).json({ error: message });
  }
});

export default router;
