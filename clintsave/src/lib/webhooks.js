export async function sendWebhookNotification(webhookUrl, payload) {
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ClintSave/1.0",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Webhook delivery failed:", response.status);
    }
  } catch (error) {
    console.error("Webhook error:", error.message);
  }
}

export async function notifyBatchComplete(sessionId, results) {
  // Get webhook URL from environment or from first download record
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) return;

  const successful = results.filter((r) => r.status === "done").length;
  const failed = results.filter((r) => r.status === "failed").length;

  await sendWebhookNotification(webhookUrl, {
    event: "batch_complete",
    sessionId,
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      successful,
      failed,
      successRate: `${((successful / results.length) * 100).toFixed(1)}%`,
    },
    downloads: results.map((r) => ({
      id: r.id,
      url: r.tiktokUrl,
      title: r.videoTitle,
      status: r.status,
      creator: r.creatorName,
    })),
  });
}
