async function main() {
  const apiKey = 'sk_TEwo96ZweoJUB5RiA31j8m1WjlDk4T9Iq9Xtn7iXBwTAVDOuzlrBisOeIK307fSK';
  const orderId = '260728EHSDARY';
  
  const getRes = await fetch('https://api.scalev.id/v3/orders/' + orderId, {
    headers: { 'Authorization': 'Bearer ' + apiKey }
  });
  const order = await getRes.json();

  console.log("Order fetched:", !!order.orderlines);
  
  const payload = {
    orderlines: order.orderlines,
    warehouse: 1,
    status: 'pending'
  };

  const patchRes = await fetch('https://api.scalev.id/v3/orders/' + orderId, {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const patchData = await patchRes.json();
  console.log(JSON.stringify(patchData, null, 2));
}
main();
