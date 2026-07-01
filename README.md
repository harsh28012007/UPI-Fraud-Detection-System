#  UPI Fraud Detection System

A backend application developed using Node.js and Express.js that detects fraudulent UPI transactions in real time using a rule-based risk scoring engine. The project simulates how modern banking and fintech platforms identify suspicious transactions, analyze user behavior, and generate fraud risk scores through RESTful APIs.


## Project Overview

Digital payment systems process millions of transactions every day, making fraud detection a critical component of modern financial applications. This project demonstrates a backend fraud detection engine that evaluates incoming UPI transactions based on predefined rules and generates a risk score to classify transactions as legitimate or potentially fraudulent.

The application is designed using a modular Node.js and Express.js architecture and exposes REST APIs for transaction processing, fraud analysis, user profiling, and transaction history management.


## Key Features

- Real-Time UPI Fraud Detection
- Rule-Based Risk Scoring Engine
- RESTful API Architecture
- Transaction Risk Classification
- Fraud Score Generation
- User Risk Profile Analysis
- Transaction History Management
- Modular Backend Architecture
- Secure Request Handling
- JSON API Responses
- Scalable Express Middleware
- Easy Integration with Frontend Applications


## Technologies Used

| Technology | Purpose |
|------------|----------|
| Node.js | Backend Runtime Environment |
| Express.js | Web Framework |
| JavaScript (ES6+) | Application Development |
| REST API | Client-Server Communication |
| JSON | Data Exchange |
| HTML | Frontend Interface |
| CSS | User Interface Styling |




## System Architecture

```
                Client Application
                        │
                        ▼
                Express.js REST API
                        │
                        ▼
                Route Handlers
                        │
                        ▼
              Fraud Detection Engine
                        │
                        ▼
             Risk Score Calculation
                        │
                        ▼
            Transaction Data Storage
                        │
                        ▼
                 JSON API Response
```



## Fraud Detection Rules

The system evaluates transactions using multiple fraud detection parameters including:

- High-value transaction detection
- Rapid consecutive transactions
- Unusual transaction timing
- New beneficiary analysis
- Device change detection
- User transaction velocity
- Behavioral risk assessment

Each triggered rule contributes to an overall fraud score.



## Project Structure

```
AI-Powered-UPI-Fraud-Detection-System
│
├── public/
│
├── routes/
│
├── controllers/
│
├── middleware/
│
├── services/
│
├── utils/
│
├── screenshots/
│
├── server.js
│
├── package.json
│
├── package-lock.json
│
├── README.md
│
├── LICENSE
│
└── .gitignore
```



## REST API Endpoints

### Submit Transaction

```
POST /api/transaction
```

Submits a new UPI transaction for fraud evaluation.



### Get Transaction History

```
GET /api/transactions
```

Returns all processed transactions.



### Get User Profile

```
GET /api/profile/:userId
```

Returns fraud statistics and transaction history for a specific user.



### Simulate Burst Transactions

```
POST /api/burst
```

Generates multiple transactions to test fraud detection rules.



### Export Transaction Data

```
GET /api/export
```

Exports transaction records.



## API Testing

The REST APIs can be tested using

- Postman
- Thunder Client
- Insomnia
- cURL



## Sample Transaction Flow

1. Client sends transaction details
2. Express API receives the request
3. Fraud Engine evaluates transaction rules
4. Risk Score is calculated
5. Transaction is classified
6. API returns fraud analysis response


## Future Enhancements

- MongoDB Integration
- JWT Authentication
- Machine Learning Fraud Prediction
- Random Forest Classification
- XGBoost Risk Analysis
- Redis Caching
- Docker Containerization
- Kubernetes Deployment
- AWS Cloud Deployment
- CI/CD Pipeline
- Real-Time Notification System
- Admin Dashboard
- Analytics Dashboard


## Learning Outcomes

This project demonstrates practical experience with

- Backend Development
- Node.js
- Express.js
- REST API Design
- API Development
- Fraud Detection Systems
- FinTech Applications
- Secure Coding Practices
- Middleware Architecture
- Modular Project Design
- Version Control using Git
- Software Engineering Best Practices



## Skills Demonstrated

- Node.js
- Express.js
- JavaScript
- REST APIs
- Backend Development
- API Design
- Risk Analysis
- Fraud Detection
- JSON Processing
- Software Architecture
- FinTech Development


