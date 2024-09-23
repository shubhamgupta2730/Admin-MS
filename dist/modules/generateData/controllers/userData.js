"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUserData = void 0;
const faker_1 = require("@faker-js/faker");
const userModel_1 = __importDefault(require("../../../models/userModel"));
const bcrypt_1 = __importDefault(require("bcrypt"));
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function generatePhoneNumber() {
    const startDigit = ['6', '7', '8', '9'];
    // Get a random starting digit
    const firstDigit = startDigit[Math.floor(Math.random() * startDigit.length)];
    // Generate the remaining 9 digits (0-9)
    let remainingDigits = '';
    for (let i = 0; i < 9; i++) {
        remainingDigits += Math.floor(Math.random() * 10).toString();
    }
    return firstDigit + remainingDigits;
}
const generateUserData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { noOfUsers, role } = req.body;
    // Validate the number of users and role
    if (!noOfUsers || isNaN(noOfUsers)) {
        return res.status(400).json({
            message: 'Please provide valid number of users.',
        });
    }
    if (!['user', 'seller'].includes(role)) {
        return res.status(400).json({
            message: 'Role must be either user or seller.',
        });
    }
    const users = [];
    for (let i = 0; i < noOfUsers; i++) {
        const firstName = faker_1.faker.person.firstName();
        const lastName = faker_1.faker.person.lastName();
        const email = `${firstName.toLowerCase()}${lastName.toLowerCase()}@gmail.com`;
        const phone = generatePhoneNumber();
        const countryCode = faker_1.faker.location.countryCode();
        const dob = randomDate(new Date(1950, 0, 1), new Date(2000, 11, 31));
        const gender = faker_1.faker.helpers.arrayElement(['male', 'female']);
        const password = faker_1.faker.internet.password();
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const address = [
            {
                addressLine1: faker_1.faker.location.streetAddress(),
                addressLine2: faker_1.faker.location.secondaryAddress(),
                street: faker_1.faker.location.street(),
                city: faker_1.faker.location.city(),
                state: faker_1.faker.location.state(),
                postalCode: faker_1.faker.location.zipCode(),
                country: faker_1.faker.location.country(),
            },
        ];
        const user = {
            email,
            phone,
            countryCode,
            password: hashedPassword,
            firstName,
            lastName,
            dob,
            gender,
            isActive: true,
            isBlocked: false,
            blockedBy: null,
            isEmailVerified: true,
            isPhoneVerified: true,
            twoFactorEnabled: false,
            role,
            address,
            isRandomGenerated: true,
        };
        users.push(user);
    }
    try {
        yield userModel_1.default.insertMany(users);
        res
            .status(201)
            .send({ message: `${noOfUsers} ${role}  created successfully` });
    }
    catch (error) {
        console.error('Error creating dummy users:', error);
        res.status(500).send({ error: 'Error creating dummy users' });
    }
});
exports.generateUserData = generateUserData;
