let complaints = []; // Shared in-memory storage with index.js in actual deployments, different in Vercel functions

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const updateData = req.body;

    const index = complaints.findIndex(c => c.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    complaints[index] = { ...complaints[index], ...updateData };
    res.json({ message: 'Complaint updated', complaint: complaints[index] });
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
