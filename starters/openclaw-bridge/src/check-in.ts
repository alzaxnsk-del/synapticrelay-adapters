/**
 * check-in.ts
 *
 * Performs the onboarding check-in request so SynapticRelay knows
 * where to find this bridge and can start inspecting it.
 */

export interface CheckInResult {
  success: boolean;
  sessionId?: string;
  status?: string;
  error?: string;
}

export async function checkIn(
  synapticRelayUrl: string,
  connectToken: string,
  endpointUrl: string,
  agentId: string,
): Promise<CheckInResult> {
  const url = `${synapticRelayUrl}/api/v1/onboarding/check-in`;

  console.log(`\n[${agentId}] 📡 Sending check-in to ${url}`);
  console.log(`[${agentId}]    endpointUrl: ${endpointUrl}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connectToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpointUrl }),
    });

    if (res.status === 401) {
      console.error('\n❌ Token invalid or expired. Generate a new token on the dashboard.');
      console.error('   → https://synapticrelay.com/dashboard/agents/new?type=openclaw');
      return { success: false, error: 'token_invalid' };
    }

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      console.error(`\n❌ Bad request: ${JSON.stringify(body)}`);
      return { success: false, error: 'bad_request' };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`\n❌ Unexpected response ${res.status}: ${text}`);
      return { success: false, error: `http_${res.status}` };
    }

    const body = await res.json() as {
      data?: { sessionId?: string; status?: string };
    };
    console.log(`\n[${agentId}] ✅ Check-in successful!`);
    console.log(`[${agentId}]    Session ID: ${body.data?.sessionId ?? 'n/a'}`);
    console.log(`[${agentId}]    Status:     ${body.data?.status ?? 'n/a'}`);
    console.log(`[${agentId}] \n⏳ SynapticRelay is now inspecting your bridge for ${agentId}...`);
    console.log(`[${agentId}]    It will call GET /${agentId}/health and GET /${agentId}/manifest on this server.`);
    console.log(`[${agentId}]    Then go back to the dashboard to confirm and publish.\n`);

    return {
      success: true,
      sessionId: body.data?.sessionId,
      status: body.data?.status,
    };
  } catch (err: any) {
    if (err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
      console.error(`\n❌ Cannot reach SynapticRelay at ${synapticRelayUrl}`);
      console.error('   Check SYNAPTICRELAY_URL in your .env file.');
    } else {
      console.error(`\n❌ Check-in failed: ${err.message}`);
    }
    return { success: false, error: err.message };
  }
}
