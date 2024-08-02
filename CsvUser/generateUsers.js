const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const faker = require('faker');

const csvWriter = createCsvWriter({
    path: 'users.csv',
    header: [
        { id: 'username', title: 'username' },
        { id: 'email', title: 'email' },
        { id: 'password', title: 'password' },
        { id: 'countryCode', title: 'countryCode' },
        { id: 'phoneNumber', title: 'phoneNumber' },
        { id: 'gender', title: 'gender' },
        { id: 'dob', title: 'dob' },
        { id: 'address', title: 'address' },
        { id: 'language', title: 'language' },
        { id: 'status', title: 'status' },
    ]
});

const generateRandomString = (length) => {
    return [...Array(length)].map(() => Math.random().toString(36)[2]).join('');
};

const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    return [...Array(10)].map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const generateUsers = (count) => {
    const users = [];
    const genders = ['Male', 'Female', 'Others'];
    const languages = ['English', 'Spanish', 'French', 'German', 'Chinese'];
    const statuses = ['Caller', 'Receiver', 'Both'];
    
    for (let i = 0; i < count; i++) {
        users.push({
            username: generateRandomString(10),
            email: faker.internet.email(),
            password: generateRandomPassword(),
            countryCode: '+1',
            phoneNumber: faker.phone.phoneNumber('##########'),
            gender: genders[Math.floor(Math.random() * genders.length)],
            dob: faker.date.between('1950-01-01', '2011-01-01').toISOString().split('T')[0],
            address: faker.address.streetAddress(),
            language: languages[Math.floor(Math.random() * languages.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)]
        });
    }
    return users;
};

const users = generateUsers(500);

csvWriter.writeRecords(users).then(() => {
    console.log('CSV file written successfully');
});