export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || !data.length) return;

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((o, i) => (o ? o[i] : ''), obj);
  };

  const columns = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' || data[0][k] === null);

  const csvRows = [];
  
  csvRows.push(columns.join(','));

  for (const row of data) {
    const values = columns.map(header => {
      let val = getNestedValue(row, header);
      if (val === null || val === undefined) val = '';
      
      const valStr = String(val);
      const escaped = valStr.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const printDocument = () => {
  window.print();
};
