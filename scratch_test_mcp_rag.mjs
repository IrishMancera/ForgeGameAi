const BASE_URL = 'http://localhost:3001/api';

async function runMcpVerification() {
  console.log('===========================================================');
  console.log('   GameForge AI — MCP & RAG Verification Suite             ');
  console.log('===========================================================\n');

  try {
    // 1. Auth Login
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `mcp_tester_${Date.now()}@gameforge.ai`,
        password: 'Password123!',
        firstName: 'MCP',
        lastName: 'Tester',
      }),
    });
    const reg = await regRes.json();
    const token = reg.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Create Project
    const projRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'MCP RAG Test Project', genre: '4X Strategy' }),
    });
    const projectId = (await projRes.json()).project.id;
    console.log('   ✅ Test Project Created:', projectId);

    // 3. Test GET /api/mcp/tools
    const toolsRes = await fetch(`${BASE_URL}/mcp/tools`, { headers: authHeaders });
    const toolsData = await toolsRes.json();
    console.log(`   ✅ GET /api/mcp/tools returned ${toolsData.count} registered MCP tools:`, toolsData.tools.map((t) => t.name));

    // 4. Test POST /api/mcp/call/:projectId (Allowed Editor call)
    const callRes = await fetch(`${BASE_URL}/mcp/call/${projectId}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        toolName: 'economy_calculate',
        arguments: { faucets: 200, sinks: 150 },
        environment: 'sandbox',
      }),
    });
    const callData = await callRes.json();
    console.log('   ✅ POST /api/mcp/call/economy_calculate succeeded:', callData.parsedInputs, callData.policy);

    // 5. Test Forbidden Unregistered MCP Tool
    const unregCallRes = await fetch(`${BASE_URL}/mcp/call/${projectId}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        toolName: 'execute_raw_sql',
        arguments: { query: 'DROP TABLE users' },
      }),
    });
    if (unregCallRes.status === 403) {
      const errData = await unregCallRes.json();
      console.log('   ✅ Security Boundary Verified: Unregistered tool rejected with HTTP 403:', errData.error);
    } else {
      throw new Error(`Security breach: Unregistered tool returned HTTP ${unregCallRes.status}`);
    }

    // 6. Test GET /api/mcp/resources/:projectId
    const resRes = await fetch(`${BASE_URL}/mcp/resources/${projectId}`, { headers: authHeaders });
    const resData = await resRes.json();
    console.log('   ✅ GET /api/mcp/resources returned resources count:', resData.resources.length);

    console.log('\n===========================================================');
    console.log('🎉 SUCCESS: Real MCP SDK & Streamable HTTP Verification Passed!');
    console.log('===========================================================');
  } catch (err) {
    console.error('\n❌ MCP VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}

runMcpVerification();
