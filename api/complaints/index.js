let complaints = []; // In-memory complaints storage (resets every cold start)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(complaints);
  } else if (req.method === 'POST') {
    const newComplaint = req.body;

    if (!newComplaint.title || !newComplaint.category) {
      res.status(400).json({ error: 'Title and category are required.' });
      return;
    }

    newComplaint.id = 'ISS-' + Date.now();
    newComplaint.status = 'Pending';
    newComplaint.reportedDate = new Date().toISOString();
    complaints.push(newComplaint);

    res.status(201).json({ message: 'Complaint added', complaint: newComplaint });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
