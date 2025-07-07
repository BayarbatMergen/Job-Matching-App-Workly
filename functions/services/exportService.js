const xlsx = require('xlsx');
const { db } = require('../config/firebase');

async function generateUsersExcelBuffer() {
  const snapshot = await db.collection('users').get();
  const users = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    users.push({
      ID: doc.id,
      이름: data.name || '',
      이메일: data.email || '',
      전화번호: data.phone || '',
      성별: data.gender || '',
      은행: data.bank || '',
      계좌번호: data.accountNumber || '',
      예금자: data.accountHolder || '',
      가입일: data.createdAt?.toDate().toLocaleString('ko-KR') || '',
    });
  });

  const worksheet = xlsx.utils.json_to_sheet(users);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, '사용자목록');

  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { generateUsersExcelBuffer };
