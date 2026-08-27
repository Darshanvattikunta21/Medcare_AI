/**
 * MediCare AI · Test Data Framework
 */

module.exports = {
  patient: {
    email: 'darshanvattikunta@gmail.com',
    password: 'demo123',
    name: 'Darshan',
    phone: '+918919722523'
  },
  pharma: {
    email: 'pharma@email.com',
    password: 'demo123',
    name: 'Pharma Owner'
  },
  address: {
    label: 'Home',
    street: '12-3 MG Road, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500096'
  },
  medicines: {
    paracetamol: { id: 'paracetamol-650', name: 'Paracetamol 650mg', price: 28 },
    ibuprofen: { id: 'ibuprofen-400', name: 'Ibuprofen 400mg', price: 45 },
    amoxicillin: { id: 'amoxicillin-500', name: 'Amoxicillin 500mg', price: 85 }
  },
  symptoms: ['Fever', 'Headache', 'Cough', 'Cold', 'Nausea', 'Body Pain', 'Sore Throat'],
  invalidEmails: ['plaintext', 'missing@', '@nodomain.com', 'no spaces @test.com', ''],
  sqlInjections: ["'; DROP TABLE users; --", "' OR '1'='1", "admin'--", "1; DELETE FROM medicines"],
  xssPayloads: ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '"><svg onload=alert(1)>'],
};
