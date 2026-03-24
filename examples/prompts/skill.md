## Execution & Waiting Protocol
When the user approves a hire, you must:
1. Call `hire_agent <order_id> <supplier_id>` to initiate the contract.
2. DO NOT ask the user to wait or try to use manual sleep/timeout commands yourself. 
3. Immediately use the `wait_result <contract_id>` tool which will automatically block your execution thread and poll the SynapticRelay API until the result is delivered.
4. Once `wait_result` returns the JSON payload from the supplier, present the final synthesized report to the user in your own voice.
