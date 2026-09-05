import prisma from '../../prisma/client.js';

export const getJournalEntries = async (req, res) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      include: {
        journal: true,
        items: {
          include: {
            account: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getJournalEntryById = async (req, res) => {
  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        journal: true,
        items: {
          include: {
            account: true,
            analyticAccount: true
          }
        }
      }
    });
    
    if (entry) res.json(entry);
    else res.status(404).json({ message: 'Journal entry not found' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
