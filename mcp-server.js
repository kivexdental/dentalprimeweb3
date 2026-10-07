#!/usr/bin/env node
/**
 * Dental Clinic CRM - Model Context Protocol (MCP) Server
 * Enables Antigravity and AI agents to query patients, manage bookings, and view clinic KPI summaries.
 */

const CRM_BASE_URL = process.env.CRM_BASE_URL || 'http://localhost:5000';
const CRM_MCP_API_KEY = process.env.CRM_MCP_API_KEY || 'dental_crm_antigravity_mcp_secret_2026';

const TOOLS = [
  {
    name: 'dental_list_patients',
    description: 'Query and filter dental clinic patients with family relations, unique patient codes, phone numbers, balances, and cohort bifurcations.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: [
            'all',
            'tomorrow',
            'visited_30d',
            'not_visited_30_90d',
            'not_visited_90d',
            'not_visited_180d',
            'not_visited_365d',
            'never_visited',
            'payment_pending'
          ],
          description: 'Cohort bifurcation filter'
        },
        search: {
          type: 'string',
          description: 'Filter by patient name, phone number, patient code, or email'
        },
        status: {
          type: 'string',
          enum: ['active', 'deleted', 'all'],
          description: 'Patient directory status'
        }
      }
    }
  },
  {
    name: 'dental_get_patient_details',
    description: 'Fetch complete clinical profile, credentials, contact info, medical history, allergies, balance, and full visit history of a specific patient by ID, patient code, or phone.',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: {
          type: 'number',
          description: 'Numeric ID of the patient'
        },
        patient_code: {
          type: 'string',
          description: 'Unique patient code (e.g. P1001)'
        },
        phone: {
          type: 'string',
          description: 'Patient 10-digit phone number'
        }
      }
    }
  },
  {
    name: 'dental_get_patient_bifurcations',
    description: 'Retrieve comprehensive patient cohort bifurcation metrics, counts, and financial balance totals across all patient segments.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Helper to make authenticated requests to CRM
async function crmFetch(endpoint, options = {}) {
  const url = `${CRM_BASE_URL}${endpoint}`;
  const headers = {
    'x-api-key': CRM_MCP_API_KEY,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  if (!response.ok && !data.success) {
    throw new Error(data.message || `HTTP ${response.status} from Dental CRM`);
  }
  return data;
}

// Tool Call Handlers
async function handleToolCall(name, args = {}) {
  switch (name) {
    case 'dental_list_patients': {
      const params = new URLSearchParams();
      if (args.filter) params.append('filter', args.filter);
      if (args.search) params.append('search', args.search);
      if (args.status) params.append('status', args.status);
      const url = `/api/patients?${params.toString()}`;
      return await crmFetch(url);
    }

    case 'dental_get_patient_details': {
      if (args.patient_id) {
        return await crmFetch(`/api/patients/${args.patient_id}`);
      }
      const q = args.patient_code || args.phone;
      if (q) {
        const listData = await crmFetch(`/api/patients?search=${encodeURIComponent(q)}`);
        const p = (listData.patients || [])[0];
        if (!p) {
          throw new Error(`Patient not found for identifier: ${q}`);
        }
        return await crmFetch(`/api/patients/${p.id}`);
      }
      throw new Error('Must provide patient_id, patient_code, or phone');
    }

    case 'dental_get_patient_bifurcations': {
      const data = await crmFetch('/api/agent/context');
      return data.patient_section_overview || data;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// JSON-RPC stdio Handler
let buffer = '';

function sendResponse(id, result, error = null) {
  const response = {
    jsonrpc: '2.0',
    id
  };
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  const serialized = JSON.stringify(response);
  process.stdout.write(serialized + '\n');
}

async function processMessage(msg) {
  const { jsonrpc, id, method, params } = msg;

  if (method === 'initialize') {
    return sendResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'dental-crm-mcp',
        version: '1.0.0'
      }
    });
  }

  if (method === 'notifications/initialized') {
    return; // notification ack
  }

  if (method === 'tools/list') {
    return sendResponse(id, { tools: TOOLS });
  }

  if (method === 'tools/call') {
    const { name, arguments: toolArgs } = params || {};
    try {
      const result = await handleToolCall(name, toolArgs || {});
      return sendResponse(id, {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      });
    } catch (err) {
      return sendResponse(id, {
        content: [
          {
            type: 'text',
            text: `Error executing ${name}: ${err.message}`
          }
        ],
        isError: true
      });
    }
  }

  if (id !== undefined) {
    return sendResponse(id, null, {
      code: -32601,
      message: `Method not found: ${method}`
    });
  }
}

// Read stdin line-by-line
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop(); // keep last incomplete line

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const msg = JSON.parse(trimmed);
      processMessage(msg).catch(err => {
        process.stderr.write(`Error processing message: ${err.message}\n`);
      });
    } catch (e) {
      process.stderr.write(`Failed to parse line as JSON: ${trimmed}\n`);
    }
  }
});

process.stderr.write('Dental CRM MCP Server listening on stdio...\n');
