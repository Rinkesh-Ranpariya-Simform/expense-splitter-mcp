# Expense Splitter MCP Server

A **Model Context Protocol (MCP)** server for managing shared expenses between groups. Built with TypeScript, MongoDB, and clean architecture principles.

Instead of manually calculating who owes whom, the server computes optimized settlements using a **debt simplification algorithm**.

## Use Cases

- Friends trip expenses
- Flatmate shared bills
- Carpool cost sharing
- Office lunch splits
- Vacation planning

## Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production
npm start

# Open inspector
npm run inspector
```

## MCP Client Configuration

You can connect to the Expense Splitter MCP server in two ways.

### Option 1: Use the hosted server (recommended)

If you just want to use the server, no local setup is required.

Simply configure your MCP client to connect to the hosted Streamable HTTP endpoint:

```json
{
  "servers": {
    "expense-splitter": {
      "type": "http",
      "url": "https://expense-splitter-mcp.onrender.com/mcp"
    }
  }
}
```

> **Note:** The server is already running on Render, so you only need to provide the URL.

For VS Code, place the same configuration in `.vscode/mcp.json`.

---

### Option 2: Run the server locally

If you want to run your own instance, you have two transport options.

#### A. stdio

With **stdio**, the MCP client starts the server for you.

Configure your client as follows:

```json
{
  "servers": {
    "expense-splitter": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"],
      "env": {
        "MONGODB_URI": "mongodb://test/expense-splitter"
      }
    }
  }
}
```

When the MCP client starts, it automatically launches:

```bash
node dist/index.js
```

No manual server startup is required.

---

#### B. Streamable HTTP

With **Streamable HTTP**, the server must already be running before the MCP client connects.

1. Enable HTTP transport:

```env
TRANSPORT=http
```

2. Start the server:

```bash
npm start
```

3. Configure your MCP client:

```json
{
  "servers": {
    "expense-splitter": {
      "type": "http",
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

The MCP client connects to the running server at `http://localhost:3001/mcp`.

> **Why doesn't the Streamable HTTP configuration include a `command`?**
>
> Because, unlike `stdio`, the MCP client does **not** start the server. It simply connects to an existing HTTP endpoint. You are responsible for starting the server (`npm start`), or you can use the hosted instance on Render.

## Available Tools (19)

### Group Management

| Tool           | Description                                         |
| -------------- | --------------------------------------------------- |
| `create_group` | Create a new expense group (with optional currency) |
| `list_groups`  | List all expense groups                             |
| `get_group`    | Get group details with members                      |
| `rename_group` | Rename a group                                      |
| `delete_group` | Soft-delete a group and all associated data         |

### Member Management

| Tool            | Description                                          |
| --------------- | ---------------------------------------------------- |
| `add_member`    | Add a member (with optional email/nickname)          |
| `remove_member` | Remove a member (only if no expenses or settlements) |
| `list_members`  | List all members in a group                          |

### Expense Management

| Tool              | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `add_expense`     | Add expense with equal/exact/percentage split        |
| `update_expense`  | Update an existing expense                           |
| `delete_expense`  | Soft-delete an expense                               |
| `search_expenses` | Search with filters (description, payer, date, etc.) |

### Balances & Settlements

| Tool                | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `get_balances`      | Get net balance for each member                       |
| `settle_debts`      | Compute optimized settlement plan                     |
| `record_settlement` | Record a payment between members (with optional note) |

### History & Reports

| Tool                | Description                                 |
| ------------------- | ------------------------------------------- |
| `get_history`       | Chronological log of expenses & settlements |
| `get_group_summary` | Summary stats (total, top spender, etc.)    |

### Import / Export

| Tool           | Description                  |
| -------------- | ---------------------------- |
| `export_group` | Export group data (JSON/CSV) |
| `import_group` | Import group from JSON data  |

## Split Types

| Type         | Description                               | Example                    |
| ------------ | ----------------------------------------- | -------------------------- |
| `equal`      | Amount divided equally among participants | ₹12,000 ÷ 4 = ₹3,000 each  |
| `exact`      | Specific amounts per participant          | Bob: ₹1,200, David: ₹1,200 |
| `percentage` | Percentage-based split                    | Alice: 60%, Bob: 40%       |

## Debt Simplification Algorithm

The server uses a **greedy algorithm** to minimize the number of transactions:

1. Compute net balance for each member (`received - paid`)
2. Separate into creditors (positive) and debtors (negative)
3. Sort both lists descending
4. Match biggest creditor with biggest debtor
5. Transfer the minimum of both amounts
6. Repeat until all debts are settled

**Complexity:** O(n log n)

### Example

Raw debts from 4 expenses could result in 6+ individual debts, but the algorithm simplifies them to just 3 transactions.

---

## Complete Example: Goa Trip

Here's a real end-to-end walkthrough showing how an AI assistant uses the Expense Splitter MCP server.

### Step 1: Create the Group

**User:** "Create an expense group called Goa Trip."

**AI calls** `create_group`:

```json
{ "name": "Goa Trip", "currency": "INR" }
```

**Response:**

```json
{ "id": "grp_abc123", "name": "Goa Trip", "currency": "INR" }
```

---

### Step 2: Add Members

**User:** "Add Alice, Bob, Charlie and David."

**AI calls** `add_member` 4 times:

```json
{ "groupId": "grp_abc123", "name": "Alice" }
{ "groupId": "grp_abc123", "name": "Bob" }
{ "groupId": "grp_abc123", "name": "Charlie" }
{ "groupId": "grp_abc123", "name": "David" }
```

---

### Step 3: Hotel Expense (Equal Split)

**User:** "Alice paid ₹12,000 for the hotel. Split it equally."

**AI calls** `add_expense`:

```json
{
  "groupId": "grp_abc123",
  "description": "Hotel",
  "amount": 12000,
  "paidBy": "Alice",
  "participants": ["Alice", "Bob", "Charlie", "David"],
  "splitType": "equal"
}
```

Each person owes **₹3,000**. Balances:

| Member  | Balance |
| ------- | ------- |
| Alice   | +9,000  |
| Bob     | -3,000  |
| Charlie | -3,000  |
| David   | -3,000  |

---

### Step 4: Dinner (Equal Split)

**User:** "Bob paid ₹3,200 for dinner."

**AI calls** `add_expense`:

```json
{
  "groupId": "grp_abc123",
  "description": "Dinner",
  "amount": 3200,
  "paidBy": "Bob",
  "participants": ["Alice", "Bob", "Charlie", "David"],
  "splitType": "equal"
}
```

Each owes ₹800. Updated balances:

| Member  | Balance |
| ------- | ------- |
| Alice   | +8,200  |
| Bob     | -600    |
| Charlie | -3,800  |
| David   | -3,800  |

---

### Step 5: Fuel (Exact Split)

**User:** "Charlie paid ₹2,400 for fuel. Bob owes ₹1,200 and David owes ₹1,200."

**AI calls** `add_expense`:

```json
{
  "groupId": "grp_abc123",
  "description": "Fuel",
  "amount": 2400,
  "paidBy": "Charlie",
  "participants": ["Bob", "David"],
  "splitType": "exact",
  "splits": { "Bob": 1200, "David": 1200 }
}
```

Balances:

| Member  | Balance |
| ------- | ------- |
| Alice   | +8,200  |
| Bob     | -1,800  |
| Charlie | -1,400  |
| David   | -5,000  |

---

### Step 6: Beach Activities (Equal Split, Subset)

**User:** "David paid ₹4,000 for beach activities. Split between Alice and David."

**AI calls** `add_expense`:

```json
{
  "groupId": "grp_abc123",
  "description": "Beach Activities",
  "amount": 4000,
  "paidBy": "David",
  "participants": ["Alice", "David"],
  "splitType": "equal"
}
```

Balances:

| Member  | Balance |
| ------- | ------- |
| Alice   | +6,200  |
| Bob     | -1,800  |
| Charlie | -1,400  |
| David   | -3,000  |

---

### Step 7: Check Balances

**User:** "Who owes whom?"

**AI calls** `get_balances`:

```json
{ "groupId": "grp_abc123" }
```

**Response:**

```
Alice    +₹6,200  (is owed money)
Bob      -₹1,800  (owes money)
Charlie  -₹1,400  (owes money)
David    -₹3,000  (owes money)
```

---

### Step 8: Simplify Debts

**User:** "Simplify the debts."

**AI calls** `settle_debts`:

```json
{ "groupId": "grp_abc123" }
```

**Response:**

```json
{
  "transactions": [
    { "from": "David", "to": "Alice", "amount": 3000 },
    { "from": "Bob", "to": "Alice", "amount": 1800 },
    { "from": "Charlie", "to": "Alice", "amount": 1400 }
  ]
}
```

**Only 3 transactions** settle the entire trip:

```
David   → Alice  ₹3,000
Bob     → Alice  ₹1,800
Charlie → Alice  ₹1,400
```

---

### Step 9: Record a Payment

**User:** "Bob paid Alice ₹1,800."

**AI calls** `record_settlement`:

```json
{
  "groupId": "grp_abc123",
  "from": "Bob",
  "to": "Alice",
  "amount": 1800,
  "note": "UPI transfer for trip settlement"
}
```

---

### Step 10: Updated Balances

**User:** "Show balances again."

**AI calls** `get_balances`:

```
Alice    +₹4,400
Bob       ₹0 ✅
Charlie  -₹1,400
David    -₹3,000
```

---

### Step 11: Trip History

**User:** "Show trip history."

**AI calls** `get_history`:

```
✓ Hotel            ₹12,000  (paid by Alice)
✓ Dinner            ₹3,200  (paid by Bob)
✓ Fuel              ₹2,400  (paid by Charlie)
✓ Beach Activities  ₹4,000  (paid by David)
✓ Settlement: Bob → Alice ₹1,800
```

---

### Step 12: Trip Summary

**User:** "Give me a summary."

**AI calls** `get_group_summary`:

```json
{
  "group": "Goa Trip",
  "members": 4,
  "expenses": 4,
  "totalSpent": 21600,
  "largestExpense": { "description": "Hotel", "amount": 12000 },
  "topSpender": "Alice",
  "outstanding": 4400
}
```

**Summary:**

```
Goa Trip Summary
────────────────
Members:            4
Expenses:           4
Total Spent:        ₹21,600
Largest Expense:    Hotel (₹12,000)
Top Spender:        Alice
Outstanding Amount: ₹4,400
```

---

## Complete Tool Flow

| #   | Action            | Tool Used           |
| --- | ----------------- | ------------------- |
| 1   | Create Goa Trip   | `create_group`      |
| 2   | Add 4 members     | `add_member` × 4    |
| 3   | Alice paid hotel  | `add_expense`       |
| 4   | Bob paid dinner   | `add_expense`       |
| 5   | Charlie paid fuel | `add_expense`       |
| 6   | David paid beach  | `add_expense`       |
| 7   | Show balances     | `get_balances`      |
| 8   | Simplify debts    | `settle_debts`      |
| 9   | Bob paid Alice    | `record_settlement` |
| 10  | Updated balances  | `get_balances`      |
| 11  | Show history      | `get_history`       |
| 12  | Trip summary      | `get_group_summary` |
