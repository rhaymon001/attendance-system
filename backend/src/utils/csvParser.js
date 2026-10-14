const { parse } = require('csv-parse/sync');

/**
 * parseCSV
 * --------
 * Parses a CSV buffer into an array of student objects using header row.
 *
 * @param   {Buffer} buffer - Buffer of the uploaded CSV file
 * @returns {Promise<Array<{name: string, email: string, matricNo: string, department: string, level: string}>>}
 */
const parseCSV = async (buffer) => {
  const records = parse(buffer, {
    columns: true,
    trim: true,
    skip_empty_lines: true,
  });

  return records;
};

module.exports = parseCSV;
