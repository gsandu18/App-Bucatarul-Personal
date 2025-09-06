// api/send_reservation.js (Node 18+)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({success:false, error:'Method not allowed'});

  const { Resend } = await import('resend'); // npm dep: "resend"
  const resend = new Resend(process.env.RESEND_API_KEY);

  const data = await req.body || {};
  // dacă trimiți cu FormData din front-end, folosește:
  // const chunks = []; for await (const c of req) chunks.push(c);
  // const raw = Buffer.concat(chunks).toString(); // parsează tu cum dorești

  // Trimite către admin
  await resend.emails.send({
    from: 'Bucătarul Personal <no-reply@domeniul-tau.ro>',
    to: 'contact@domeniul-tau.ro',
    subject: `Cerere nouă rezervare`,
    html: `<p>Nouă cerere de rezervare (vezi dashboard/email).</p>`
  });

  return res.json({ success:true });
}
