require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const puppeteer = require("puppeteer");
const genericPool = require("generic-pool");

const app = express();
const PORT = process.env.PORT || 5009;
const PDF_DIR = path.join(__dirname, "pdfs");

// Create the PDFs directory if it doesn't exist
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR);
}

// Middleware to parse JSON payloads
app.use(bodyParser.json());

// Custom middleware to handle raw text payloads for /html-text
app.use("/html-text", bodyParser.text());

app.get("/", (req, res) => {
  res.send("Backend Running!");
});

// Function to generate HTML string with embedded data
const generateGoogleReviewHTML = (data) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
      integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
    <title>Reports</title>
    <style>
      *,
      *::after,
      *::before {
        margin: 0;
        padding: 0;
      }
      :root {
        font-size: 14px;
        font-family: "Poppins", sans-serif;
      }
      @page {
        size: A4;
        margin: 0;
      }
      body {
        background-image: url(https://demo.emovur.com/grid.png);
        background-repeat: no-repeat;
        object-fit: cover;
        background-position-x: center;
        background-size: contain;
        padding: 30px;
      }
      @media print {
        body {
          background-image: url(https://demo.emovur.com/grid.png);
          background-repeat: no-repeat;
          object-fit: cover;
          background-position-x: center;
          background-size: contain;
          padding: 30px;
        }
        .footer-report {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 0;
        }
        .footer-image img {
          width: 80px;
          height: auto;
          margin-top: 5px;
          margin-left: 10px;
        }
        .footer-slash p {
          margin: 0 10px;
          font-weight: 800;
        }
        .footer-contact {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 5px;
        }
        .table-header {
          display: table-header-group;
        }
        .report-table table {
          page-break-inside: auto;
        }
        .report-table thead {
          display: table-header-group;
        }
        .report-table tbody tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 20px 25px;
      }
      .org-image {
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }
      .partner-image {
        display: flex;
        align-items: center;
        justify-content: flex-end;
      }
      .org-image p {
        font-size: 35px;
        font-weight: 600;
      }
      .org-image img,
      .partner-image img {
        max-width: 100%; /* Ensures the images do not exceed their natural size */
        height: auto;
        display: block;
      }
      .org-image img {
        width: 40%;
        height: auto;
      }
      .partner-image img {
        width: 60%;
        height: auto;
      }
      .title {
        display: block;
        align-items: center;
        justify-content: center;
        text-align: center;
        margin: 60px 0 30px 0;
      }
      .page-break {
        page-break-before: always;
      }
      .title-head {
        font-size: 70px;
      }
      .title-head-date {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 15px;
      }
      .title-head-date span {
        font-size: 70px;
        font-weight: 800;
      }
      .card {
        background-color: #0c9ffa;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        max-width: 400px; /* Adjust width as needed */
        margin: 0;
        padding: 0 5px;
        color: #ffffff;
      }
      .card h1 {
        font-size: 45px;
      }
      .total-reviews {
        display: flex;
        align-items: center;
        justify-content: space-around;
        margin-bottom: 30px;
      }
      .total-reviews-header {
        display: flex;
        align-items: center;
        font-size: 18px;
        gap: 30px;
        margin-bottom: 10px;
        margin-left: 10px;
      }
      .total-reviews-head-data {
        font-size: 30px;
        padding-top: 65px;
        margin-left: 20px;
      }
      .total-reviews-subheading {
        margin-left: 15px;
      }
      .total-reviews-subheading-2 {
        margin-left: 15px;
      }
      .total-reviews-data {
        display: flex;
        align-items: center;
        gap: 20px;
        font-size: 20px;
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        max-width: 800px; /* Adjust width as needed */
        padding: 20px 20px;
      }
      .card-1,
      .card-2,
      .card-3,
      .card-4,
      .card-5 {
        background-color: #0c9ffa;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        max-width: 400px; /* Adjust width as needed */
        margin: 0;
        padding: 25px 20px;
        color: #ffffff;
      }
      .card-2 {
        margin-left: 15px;
      }
      .card-1 {
        padding: 25px 25px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 20px 20px;
      }
      td,
      th {
        text-align: center;
        padding: 8px;
      }
      td:nth-child(1) {
        text-align: left;
        padding: 8px;
      }
      tr:nth-child(odd) {
        background-color: #dddddd;
      }
      .report-table {
        max-width: 95%;
      }
      .footer-report {
        padding-top: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .footer-image img {
        width: 80px;
        height: auto;
        margin-top: 5px;
        margin-left: 10px;
      }
      .footer-slash p {
        margin: 0 10px;
        font-weight: 800;
      }
      .footer-contact {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 5px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="org-image">
        ${
          data.org.logo
            ? `<img
          id="orgLogo"
          src="${data.org.logo}"
          alt="Organization Logo"
        />`
            : `
        <p>${data.org.name}</p>
        `
        }
      </div>
      <div class="partner-image">
        <img
          id="partnerLogo"
          src="${data.partnerDetails.logo}"
          alt="Partner Logo"
        />
      </div>
    </div>
    <div class="title">
      <div class="title-head">Google Reviews</div>
      <div class="title-head-date">
        <span>Report</span>
        <div class="card">
          <h1 id="reportDate">${data.reportDate}</h1>
        </div>
      </div>
    </div>
    <div class="total-reviews">
      <div class="total-reviews-head-data"><b>Total </b><br />Reviews</div>
      <div>
        <div class="total-reviews-header">
          <p>Yesterday</p>
          <p>Present<br />Month</p>
          <p>Last<br />30Days</p>
          <p class="total-reviews-subheading">Total<br />Reviews</p>
          <p class="total-reviews-subheading-2">Rating</p>
        </div>
        <div class="total-reviews-data">
          <p class="card-1">${data.totalReviews.yesterday}</p>
          <p class="card-2">${data.totalReviews.presentMonth}</p>
          <p class="card-3">${data.totalReviews.lastThirtyDays}</p>
          <p class="card-4">${data.totalReviews.totalReviews}</p>
          <p class="card-5">${data.totalReviews.rating}</p>
        </div>
      </div>
    </div>
    <div class="report-table">
      <table>
        <thead>
          <tr style="background-color: black; color: #ffffff">
            <th>Location Name</th>
            <th>POC User</th>
            <th>Yesterday</th>
            <th>Present<br />Month</th>
            <th>Last 30<br />Days</th>
            <th>Total<br />Reviews</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody style="margin-bottom: 20px">
          ${data.reviewsData
            .map(
              (item) => `
          <tr>
            <td>${item.locationName}</td>
            <td>${item.pocUser}</td>
            <td>${item.yesterday}</td>
            <td>${item.presentMonth}</td>
            <td>${item.lastThirtyDays}</td>
            <td>${item.totalReviews}</td>
            <td>${item.rating}</td>
          </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="footer-report">
      <div><p>Powered by</p></div>
      <div class="footer-image">
        <img
          id="footerLogo"
          src="${data.partnerDetails.logo}"
          alt="Footer Logo"
        />
      </div>
      <div class="footer-slash"><p>|</p></div>
      <div class="footer-contact">
        <div><i class="fa-solid fa-phone"></i></div>
        <div>
          <p id="partnerMobile">${data.partnerDetails.mobileNumber}</p>
        </div>
        <div style="margin-left: 10px">
          <i class="fa-regular fa-envelope"></i>
        </div>
        <div><p id="partnerEmail">${data.partnerDetails.email}</p></div>
        <div style="margin-left: 10px"><i class="fa-solid fa-globe"></i></div>
        <div><p id="partnerWebsite">${
          data.partnerDetails.website ? data.partnerDetails.website : ""
        }</p></div>
      </div>
    </div>
  </body>
</html>
`;

const generateWhatsAppWeeklyHTML = (data) => `
<!-- weeklyreport.html -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
      integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
    <title>Reports</title>
    <style>
      *,
      *::after,
      *::before {
        margin: 0;
        padding: 0;
      }
      :root {
        font-family: "poppins", sans-serif;
      }
      @page {
        size: A4;
        margin: 0px;
      }
      body {
        background-image: url(https://demo.emovur.com/background-image.png);
        background-repeat: no-repeat;
        object-fit: cover;
        background-position-x: center;
        background-size: contain;
        font-size: 14px;
      }

      @media print {
        @page {
          size: A4;
          margin: 0px 0 30px;
        }
        body {
          background-image: url(https://demo.emovur.com/background-image.png);
          background-repeat: no-repeat;
          object-fit: cover;
          background-position-x: center;
          background-size: contain;
          font-size: 14px;
        }

        table {
          page-break-after: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        td {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        thead {
          display: table-header-group;
        }

        .page-break {
          page-break-before: always;
        }
        .footer-report {
          position: fixed;
          bottom: -1%;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 0;
        }

        .footer-image img {
          width: 80px;
          height: auto;
          margin-top: 5px;
          margin-left: 10px;
        }

        .footer-slash p {
          margin: 0 10px;
          font-weight: 800;
        }

        .footer-contact {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 5px;
        }
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 20px 25px 0 25px;
      }
      .org-image {
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }
      .partner-image {
        display: flex;
        align-items: center;
        justify-content: flex-end;
      }
      .org-image p {
        font-size: 35px;
        font-weight: 600;
      }

      .org-image img,
      .partner-image img {
        max-width: 100%; /* Ensures the images do not exceed their natural size */
        height: auto;
        display: block;
      }

      .org-image img {
        width: 40%;
        height: auto;
      }

      .partner-image img {
        width: 60%;
        height: auto;
      }
      .title {
        margin: 20px 0px 30px 20px;
      }
      .title-header {
        font-size: 50px;
        color: #606060;
        margin-bottom: -12px;
      }
      .weekly-report {
        font-size: 35px;
        font-weight: 600;
        margin-top: 0;
        color: #454545;
      }
      .date-report {
        font-size: 22px;
        margin-top: 3px;
        color: #606060;
      }
      .card-report-twocards {
        display: flex;
        width: 100%;
        margin-top: 20px;
      }

      .card-individual {
        width: 250px;
        height: 145px;
        margin: 0 20px; /* Space around the card */
        padding: 10px; /* Inner spacing */
        border-radius: 10px; /* Rounded corners */
        box-shadow: 0px 0px 10px #80808070;
        transition: transform 0.3s, box-shadow 0.3s; /* Smooth transition effects */
      }
      .individual-broadcast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #dddddd;
        padding-bottom: 5px;
        gap: 40px;
      }
      .individual-broadcast p {
        font-size: 16px;
        color: #0c9ffa;
        font-weight: 700;
      }
      .individual-broadcast strong {
        font-size: 25px;
        font-weight: 700;
      }

      .journey-title {
        font-size: 16px;
        color: #0c9ffa;
        font-weight: 700;
        margin-top: 5px;
      }
      .journey {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .journey p {
        font-size: 16px;
        font-weight: 400;
      }
      .journey strong {
        font-size: 25px;
        font-weight: 800;
        display: block;
        text-align: center;
        justify-content: center;
      }
      .table-report {
        font-family: arial, sans-serif;
        border-collapse: collapse;
        border-radius: 10px; /* Rounded corners */
        box-shadow: 0px 0px 10px #80808070;
        transition: transform 0.3s, box-shadow 0.3s; /* Smooth transition effects */
      }

      .table-report td,
      .table-report th {
        text-align: left;
        padding: 8px 20px;
      }
      .table-data td {
        border-bottom: 1px solid #dddddd;
      }
      .table-report th:nth-child(1) {
        color: #0c9ffa;
        font-weight: 700;
      }
      .table-data-total td {
        color: #0c9ffa;
        font-weight: 600;
      }
      .table-sections {
        display: flex;
        max-width: 100%;
        margin: 20px; /* Space around the card */
        padding: 15px; /* Inner spacing */
        border-radius: 10px; /* Rounded corners */
        box-shadow: 0px 0px 10px #80808070;
        transition: transform 0.3s, box-shadow 0.3s; /* Smooth transition effects */
      }
      .table-messages {
        font-family: arial, sans-serif;
        border-collapse: collapse;
        width: 60%;
      }
      .table-messages tr:nth-child(even) {
        background-color: #dddddd;
      }

      .table-messages-header {
        background-color: #0c9ffa;
        padding: 10px 0;
        color: #ffffff;
        border-radius: 10px;
      }
      .tables-container {
        display: flex;
        gap: 20px; /* Space between tables */
        margin: 20px;
        padding: 15px; /* Inner spacing */
        border-radius: 10px; /* Rounded corners */
        box-shadow: 0px 0px 10px #80808070;
        transition: transform 0.3s, box-shadow 0.3s; /* Smooth transition effects */
        align-items: center;
        justify-content: center;
      }

      .flex-table {
        border-radius: 10px; /* Rounded corners */
        border-spacing: 30px 3px;
        width: 100%;
      }
      .page-break {
        page-break-before: always;
      }

      .flex-table th {
        text-align: center;
        border-radius: 10px;
      }
      .flex-table td {
        text-align: center;
        padding: 3px;
      }

      .flex-table thead {
        background-color: #0c9ffa; /* Blue background for header */
        color: white; /* White text color for header */
      }

      .flex-table tbody tr:nth-child(odd) {
        background-color: #f0efef; /* Light gray background for odd rows */
      }

      .flex-table tbody tr:nth-child(even) {
        background-color: #ffffff; /* White background for even rows */
      }

      .flex-table th {
        background-color: #0c9ffa;
        color: #ffffff;
      }
      .flex-table-header th {
        padding: 5px 0px;
      }

      .table-container-massage {
        border-radius: 10px; /* Rounded corners */
        box-shadow: 0px 0px 10px #80808070;
        transition: transform 0.3s, box-shadow 0.3s; /* Smooth transition effects */
        margin: 20px 20px; /* Space around the card */
        max-width: 100%;
        padding: 10px;
      }
      .table-container-day-wise {
        border-radius: 10px; /* Rounded corners */
        box-shadow: 0px 0px 10px #80808070;
        transition: transform 0.3s, box-shadow 0.3s; /* Smooth transition effects */
        margin: 20px 20px; /* Space around the card */
        max-width: 100%;
        padding: 10px;
      }

      .individual-broadcast-table-head {
        width: 200px;
        margin: 20px 20px 20px 20px; /* Space around the card */
        padding: 10px; /* Inner spacing */
        border-radius: 10px; /* Rounded corners */
        box-shadow: 0px 0px 10px #80808070;
        transition: transform 0.3s, box-shadow 0.3s; /* Smooth transition effects */
        background-color: #0c9ffa;
        color: #ffffff;
        font-size: 16px;
        text-align: center;
        font-weight: 700;
      }
      .table-container-individual-broadcast {
        border-radius: 10px; /* Rounded corners */
        box-shadow: 0px 0px 10px #80808070;
        transition: transform 0.3s, box-shadow 0.3s; /* Smooth transition effects */
        margin: 10px 20px; /* Space around the card */
      }
      .individual-broadcast-table {
        width: 100%;
        border-spacing: 5px 10px;
      }
      .individual-broadcast-table tr:nth-child(odd) {
        background-color: #f0efef;
      }
      .individual-broadcast-table td{
        padding: 2px 5px;
      }
      .individual-broadcast-table th {
        padding: 10px 5px;
      }
      .individual-broadcast-table th:nth-child(1) {
        color: #000000;
      }
      .individual-broadcast-table th:nth-child(5) {
        color: rgb(0, 164, 81);
      }
      .individual-broadcast-table th:nth-child(6) {
        color: rgb(0, 104, 56);
      }
      .individual-broadcast-table th:nth-child(7) {
        color: rgb(27, 117, 186);
      }
      .individual-broadcast-table th:nth-child(8) {
        color: rgb(231, 5, 5);
      }
      #journeyDetailsTable td, #broadcastDetailsTable td, #dateWiseDataTable td , #totalMessagesTable td{
        font-size: 14px;
        text-align: center;
      }
      /* <!-- Footer --> */

      .footer-image img {
        width: 80px;
        height: auto;
        margin-top: 5px;
        margin-left: 10px;
      }
      .footer-slash p {
        margin: 0 10px;
        font-weight: 800;
      }
      .footer-contact {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 5px;
      }

      .footer-contact div {
        text-align: center;
      }

      .footer-contact i {
        font-size: 12px; /* Adjust icon size as needed */
        width: 20px; /* Fixed width for the icon container */
        height: 20px; /* Fixed height for the icon container */
        line-height: 20px; /* Center the icon vertically */
        border-radius: 50%; /* Make the icon container round */
        background-color: #ffffff; /* Background color for the round icon container */
        border: 1px solid #0b0b0b; /* Border color for the round icon container */
      }
      .message-icon {
        width: 15px; /* Adjust width as needed */
        height: auto; /* Maintain aspect ratio */
        margin-left: 5px; /* Adjust margin as needed */
        vertical-align: middle; /* Align image vertically */
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="org-image">
            ${
              data.org.logo
                ? `<img
              id="orgLogo"
              src="${data.org.logo}"
              alt="Organization Logo"
            />`
                : `
            <p>${data.org.name}</p>
            `
            }
          </div>
          <div class="partner-image">
            <img
              id="partnerLogo"
              src="${data.partnerDetails.logo}"
              alt="Partner Logo"
            />
          </div>
        </div>

        <!-- Report Title -->
        <div class="page">
          <div class="title">
            <p class="title-header">WhatsApp Marketing</p>
            <p class="weekly-report">Weekly report</p>
            <p class="date-report" id="reportDate">
              ${data.reportDate.startDate} to ${data.reportDate.endDate}
            </p>
          </div>
        </div>

        <!-- Card Report -->
        <div class="card-report-twocards">
          <div class="card-individual">
            <div class="individual-broadcast">
              <p>Individual Broadcasts</p>
              <strong id="individualBroadcasts"
                >${data.broadcastStats.individualBroadcasts}</strong
              >
            </div>
            <div class="broadcast-journeys">
              <div class="journey-title"><p>Broadcast Journeys</p></div>
              <div class="journey">
                <div>
                  <p>Initiation</p>
                  <strong id="initiation"
                    >${data.broadcastStats.broadcastJourneys.initiation}</strong
                  >
                </div>
                <div>
                  <p>Broadcasts</p>
                  <strong id="broadcasts"
                    >${
                      data.broadcastStats.broadcastJourneys.broadcasts.processed
                    }
                    / ${data.broadcastStats.broadcastJourneys.broadcasts.total}
                  </strong>
                </div>
              </div>
            </div>
          </div>
          <!-- Conversations Table -->
          <table class="table-report">
            <thead>
              <tr>
                <th>Conversations</th>
                <th>All</th>
                <th>Free</th>
                <th>Cost</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody id="conversationsTable">
              ${data.conversations
                .map(
                  (item) => `
              <tr
                class="${
                  item.type === "Total" ? "table-data-total" : "table-data"
                }"
              >
                <td>
                  ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </td>
                <td>${item.all}</td>
                <td>${item.free}</td>
                <td>${item.cost}</td>
                <td>${item.paid}</td>
              </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Total Messages Table -->
        <div class="table-container-massage">
          <table class="flex-table">
            <thead>
              <tr class="flex-table-header">
                <th style="width: 33%">Messages</th>
                <th style="width: 33%">
                  Individual Broadcasts<br />
                  (No. of messages)
                </th>
                <th style="width: 33%">
                  Broadcast Journeys<br />
                  (No. of messages)
                </th>
              </tr>
            </thead>
            <tbody id="totalMessagesTable">
              ${data.totalMessagesData
                .map(
                  (item) => `
              <tr>
                <td>
                  ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </td>
                <td>${item.broadcasts}</td>
                <td>${item.journeys}</td>
              </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Date Wise Data -->
        <div class="table-container-day-wise">
          <table class="flex-table">
            <thead>
              <tr class="flex-table-header">
                <th style="padding: 5px 37px; width: 33%">Day</th>
                <th style="padding: 5px 35px; width: 33%">No. of Broadcast</th>
                <th style="padding: 5px 30px; width: 33%">
                  No. of Journeys<br />
                  Initiated
                </th>
              </tr>
            </thead>
            <tbody id="dateWiseDataTable">
              ${data.dateWiseData
                .map(
                  (item) => `
              <tr>
                <td>${item.date}</td>
                <td>${item.broadcasts}</td>
                <td>${item.journeys}</td>
              </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="page-break"></div>
        <!-- Individual Broadcasts Table -->
        <div class="individual-broadcast-table-head">
          <p>Individual broadcasts</p>
        </div>
        <div class="table-container-individual-broadcast">
          <table class="individual-broadcast-table">
            <thead>
              <tr style="background-color: #c8e6f8">
                <th>Campaign Name</th>
                <th>Date</th>
                <th>Template</th>
                <th>Total</th>
                <th>Read</th>
                <th>Delivered</th>
                <th>Sent</th>
                <th>Failed</th>
              </tr>
            </thead>
            <tbody id="broadcastDetailsTable">
              ${data.broadcastDetails
                .map(
                  (item) => `
              <tr>
                <td>${item.campaignName}</td>
                <td>${item.date}</td>
                <td>${item.template}</td>
                <td>${item.total}</td>
                <td>${item.read}</td>
                <td>${item.delivered}</td>
                <td>${item.sent}</td>
                <td>${item.failed}</td>
              </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="page-break"></div>
        <!-- Broadcast Journeys Table -->
        <div class="individual-broadcast-table-head">
          <p>Broadcast Journeys</p>
        </div>
        <div class="table-container-individual-broadcast">
          <table class="individual-broadcast-table">
            <thead>
              <tr style="background-color: #c8e6f8">
                <th>Journey Name</th>
                <th>Date</th>
                <th>Template</th>
                <th>Total</th>
                <th>Read</th>
                <th>Delivered</th>
                <th>Sent</th>
                <th>Failed</th>
              </tr>
            </thead>
            <tbody id="journeyDetailsTable">
              ${data.journeyDetails
                .map((journey) => {
                  const broadcasts = journey.processBroadcasts
                    .map(
                      (broadcast, index) => `
              <tr>
                ${
                  index === 0
                    ? `
                <td rowspan="${journey.processBroadcasts.length}">
                  ${journey.journeyName}<br />${journey.initiatedDateTime}
                </td>
                `
                    : ""
                }
                <td>${broadcast.processedDateTime}</td>
                <td>${broadcast.template}</td>
                <td>${broadcast.total}</td>
                <td>${broadcast.read}</td>
                <td>${broadcast.delivered}</td>
                <td>${broadcast.sent}</td>
                <td>${broadcast.failed}</td>
              </tr>
              `
                    )
                    .join("");
                  return broadcasts;
                })
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="footer-report">
          <div><p>Powered by</p></div>
          <div class="footer-image">
            <img
              id="footerLogo"
              src="${data.partnerDetails.logo}"
              alt="Footer Logo"
            />
          </div>
          <div class="footer-slash"><p>|</p></div>
          <div class="footer-contact">
            <div><i class="fa-solid fa-phone"></i></div>
            <div>
              <p id="partnerMobile">${data.partnerDetails.mobileNumber}</p>
            </div>
            <div style="margin-left: 10px">
              <i class="fa-regular fa-envelope"></i>
            </div>
            <div><p id="partnerEmail">${data.partnerDetails.email}</p></div>
            <div style="margin-left: 10px">
              <i class="fa-solid fa-globe"></i>
            </div>
            <div>
              <p id="partnerWebsite">
                ${
                  data.partnerDetails.website ? data.partnerDetails.website : ""
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;

const generateInvoiceHTML = (data) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
      integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
    <title>Invoice</title>
    <style>
      /* General Styles */
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
      }

      :root {
        font-family: "poppins", sans-serif;
      }

      .invoice-container {
        max-width: 100%;
        margin: 50px 20px;
        padding: 20px;
        background-color: #fff;
        box-sizing: border-box;
      }

      .header {
        display: flex;
        justify-content: space-between !important;
        align-items: center;
        margin-bottom: 20px;
        font-family: arial, sans-serif;
      }

      .header img {
        height: 60px;
      }

      .section {
        margin-bottom: 20px;
      }

      .section h3 {
        margin-bottom: 10px;
      }

      .details {
        display: flex;
        justify-content: space-between;
      }

      .details div {
        width: 48%;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
      }

      .table th,
      .table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
        font-family: arial, sans-serif;
      }

      .table th {
        background-color: #f2f2f2;
      }

      .total {
        margin-right: 30px;
        display: flex;
        justify-content: right;
        align-items: center;
        gap: 100px;
      }
      .total-data-container {
        margin-top: 60px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .bill-to-section {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }

      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 0.9em;
        color: #555;
      }
      .invoice-header {
        width: 40%;
      }
      .company-name {
        font-size: 20px;
        font-family: arial, sans-serif;
        font-weight: bold;
        text-align: right;
      }
      .company-name-address {
        font-size: 14px;
        text-align: right;
        font-family: arial, sans-serif;
      }
      .company-name-bill {
        font-size: 20px;
        font-weight: bold;
        text-align: left;
        margin-bottom: 10px;
        font-family: arial, sans-serif;
      }
      .company-name-address-bill {
        font-size: 14px;
        text-align: left;
        margin-bottom: 5px;
        font-family: arial, sans-serif;
      }
      .address {
        font-size: 14px;
        line-height: 1;
        margin-bottom: 10px;
        width: 100%;
        line-height: 1.5;
        text-align: right;
        font-family: arial, sans-serif;
      }
      .company-details {
        display: block;
        width: 60%;
        line-height: 1.5;
        font-family: arial, sans-serif;
      }
      p {
        margin: 0;
      }
      .invoice-line {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        width: 100%;
        height: 40px; /* Adjust based on your design */
        margin: 20px 0 30px 0;
      }

      .invoice-line::before,
      .invoice-line::after {
        content: "";
        position: absolute;
        top: 50%;
        width: 42%;
        height: 1px;
        background-color: #ccc;
      }

      .invoice-line::before {
        left: 0;
      }

      .invoice-line::after {
        right: 0;
      }

      .invoice-text {
        background-color: #fff; /* Background color to make text appear on top of the line */
        padding: 0 10px; /* Space around the text */

        font-size: 20px;
        font-family: arial, sans-serif;
        color: rgba(6, 148, 224, 0.6);
      }
      .invoice-header-tablerow {
        font-size: 14px;
        font-weight: 300;
        font-family: arial, sans-serif;
      }
      .table-container-main {
        margin-top: 50px;
      }
      .sr-no {
        font-weight: 100;
      }
      .total-data {
        margin-bottom: 20px;
        font-weight: 300;
        font-size: 14px;
        font-family: arial, sans-serif;
      }
      #grand-total-divider {
        border-top: #ccc 1px solid;
        padding: 10px 0px 0px;
        border-bottom: #ccc 1px solid;
      }

      /* Print Styles */
      @media print {
        body {
          background-color: #fff;
        }

        @page {
          size: A4;
          margin: 0;
        }
        .header {
          display: flex;
          justify-content: space-between !important;
          align-items: center;
        }

        .header,
        .footer {
          break-inside: avoid; /* Prevent header/footer splitting across pages */
        }
      }
    </style>
  </head>
  <body>
    <div class="invoice-container">
      <div class="header">
        <img src="https://emovur.com/images/logo/logo.png" alt="Logo" />
        <div id="company-details" class="company-details">
          <p class="company-name">${data.partnerProfile.billingName}</p>
          <p class="company-name-address">
            ${data.partnerProfile.addressLine1}
            <span class="address-line"
              >${data.partnerProfile.addressLine2}</span
            >
          </p>
          <p class="company-name-address">
            ${data.partnerProfile.city}
            <span class="address-line">${data.partnerProfile.state}</span> -
            <span class="address-line">${data.partnerProfile.pincode}</span>
          </p>
          <p class="company-name-address">
            GSTIN: ${data.partnerProfile.gstin}
          </p>
        </div>
      </div>

      <div class="invoice-line">
        <span class="invoice-text">INVOICE</span>
      </div>

      <div class="bill-to-section">
        <div>
          <div id="billing-details">
            <p class="company-name-address-bill">Bill To</p>
            <p class="company-name-bill">${data.orgProfile.billingName}</p>
            <p class="company-name-address-bill">
              ${data.orgProfile.addressLine1}
            </p>
            <p class="company-name-address-bill">
              ${data.orgProfile.addressLine2}
            </p>
            <p class="company-name-address-bill">${data.orgProfile.city}</p>
            <p class="company-name-address-bill">
              ${data.orgProfile.state}
              <span class="address-line">- ${data.orgProfile.pincode}</span>
            </p>
          </div>
        </div>
        <div class="invoice-header">
          <table class="table">
            <tr>
              <th class="invoice-header-tablerow">Invoice #</th>
              <td id="invoice-number" class="invoice-header-tablerow">
                ${data.invoiceNo}
              </td>
            </tr>
            <tr>
              <th class="invoice-header-tablerow">Invoice Date</th>
              <td id="invoice-date" class="invoice-header-tablerow">
                ${data.invoiceDate}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <div class="table-container-main">
        <table class="table">
          <thead>
            <tr>
              <th class="sr-no">#</th>
              <th class="sr-no">Item & Description</th>
              <th class="sr-no">Qty</th>
              <th class="sr-no">CGST</th>
              <th class="sr-no">Amount</th>
            </tr>
          </thead>
          <tbody id="items-table">
            <!-- Items will be dynamically added here -->
          </tbody>
        </table>
      </div>

      <div class="total-data-container">
        <img
          src="https://wd.emovur.com/sigh.png"
          alt="Logo"
          width="250"
          height="200"
        />
        <div>
          <div class="total">
            <p class="total-data">Sub Total</p>
            <p id="sub-total" class="total-data">${data.subTotal}</p>
          </div>
          <div class="total">
            <p class="total-data">CGST</p>
            <p id="cgst" class="total-data">${data.cgst}</p>
          </div>
          <div class="total">
            <p class="total-data">IGST</p>
            <p id="sgst" class="total-data">${data.igst}</p>
          </div>

          <div class="total" id="grand-total-divider">
            <p class="total-data">Grand Total</p>
            <p id="grand-total" class="total-data">${data.grandTotal}</p>
          </div>
        </div>
      </div>
    </div>

    <script>
      const data = {
        partnerProfile: {
          addressLine1: "303, SLV PRINSS APARTMENT",
          addressLine2: "BGS Global Hsopital Road,Mylasandra Village",
          billingName: "Emovur - Audentrix Pvt Ltd",
          city: "Bengaluru",
          country: "India",
          createdAt: "2024-12-06T12:52:08.250Z",
          gstin: "29AARCA0604L1ZG",
          pincode: "560060",
          state: "Karnataka",
        },
        orgProfile: {
          addressLine1: "303, SLV PRINSS APARTMENT",
          addressLine2: "BGS Global Hsopital Road,Mylasandra Village",
          billingName: "Emovur - Audentrix Pvt Ltd",
          city: "Bengaluru",
          country: "India",
          createdAt: "2024-12-06T12:52:08.250Z",
          gstin: "29AARCA0604L1ZG",
          pincode: "560060",
          state: "Karnataka",
        },
        invoiceNo: "EMO230238",
        invoiceDate: "01/11/2023",

        items: [
          {
            item: "Balance",
            quantity: "500",
            taxPer: "9",
            taxAmount: "45",
            finalAmount: "545",
          },
        ],
        billing: {
          amount: "500",
          tax: "45",
          finalAmount: "545",
        },
      };

      function populatePlaceholders() {
        // Replacing placeholders in company details
        const companyDetails = document.getElementById("company-details");
        companyDetails.innerHTML = companyDetails.innerHTML.replace(
          /\$\{data\.partnerProfile\.(\w+)\}/g,
          (_, key) => data.partnerProfile[key] || ""
        );

        // Replacing placeholders in billing details
        const billingDetails = document.getElementById("billing-details");
        billingDetails.innerHTML = billingDetails.innerHTML.replace(
          /\$\{data\.orgProfile\.(\w+)\}/g,
          (_, key) => data.orgProfile[key] || ""
        );

        // Replacing invoice details
        document.getElementById("invoice-number").textContent = data.invoiceNo;
        document.getElementById("invoice-date").textContent = data.invoiceDate;

        // Dynamically populate the items table
        const itemsTable = document.getElementById("items-table");

        // Clear any existing rows in the table body
        itemsTable.innerHTML = "";

        // Loop through each item and create a table row
        data.items.forEach((item, index) => {
          const row = document.createElement("tr");

          // Create each cell and append it to the row
          const cell1 = document.createElement("td");
          cell1.textContent = index + 1;
          row.appendChild(cell1);

          const cell2 = document.createElement("td");
          cell2.textContent = item.item;
          row.appendChild(cell2);

          const cell3 = document.createElement("td");
          cell3.textContent = item.quantity;
          row.appendChild(cell3);

          const cell4 = document.createElement("td");
          cell4.textContent = item.taxAmount;
          row.appendChild(cell4);

          const cell5 = document.createElement("td");
          cell5.textContent = item.finalAmount;
          row.appendChild(cell5);

          // Append the row to the table body
          itemsTable.appendChild(row);
        });

        // Populating totals
        document.getElementById("sub-total").textContent = data.billing.amount;
        document.getElementById("cgst").textContent = data.billing.tax;
        document.getElementById("sgst").textContent = data.billing.tax;
        document.getElementById("grand-total").textContent =
          data.billing.finalAmount;

        // Populating bank details (example placeholder)
        document.getElementById("bank-details").textContent =
          "Bank Details: Example Bank, Account No: 123456789";
      }

      // Call the function to populate the placeholders
      populatePlaceholders();
    </script>
  </body>
</html>
`;

// Puppeteer pool configuration
const browserPool = genericPool.createPool(
  {
    create: () =>
      puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true,
        timeout: 60000,
        protocolTimeout: 120000,
      }),
    destroy: (browser) => browser.close(),
  },
  {
    max: 5, // Maximum number of browsers
    min: 2, // Minimum number of browsers
  }
);

// Utility to generate PDF
const generatePDF = async (htmlContent) => {
  const browser = await browserPool.acquire();
  let pdfBuffer;

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    });
    await page.close();
  } catch (error) {
    console.error("Error generating PDF:", error.message);

    if (error.message.includes("Network.enable timed out")) {
      throw new Error("Network timeout: The page took too long to load.");
    } else if (error.message.includes("ProtocolError")) {
      throw new Error("Protocol error: Puppeteer encountered a problem.");
    } else {
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  } finally {
    await browserPool.release(browser);
  }

  return pdfBuffer;
};

// Handle PDF generation requests
const handlePDFRequest = async (req, res, generateHTMLFunction) => {
  const data = req.body;

  if (!data) {
    return res.status(400).json({ error: "JSON data is required" });
  }

  try {
    const htmlContent = generateHTMLFunction(data);
    const pdfBuffer = await generatePDF(htmlContent);

    const pdfId = uuidv4();
    const pdfPath = path.join(PDF_DIR, `${pdfId}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);

    return res.json({
      url: `${req.protocol}://${req.get("host")}/pdfs/${pdfId}`,
    });
  } catch (error) {
    console.log("Error generating PDF:", error);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
};

// Routes
app.post("/google-review", (req, res) =>
  handlePDFRequest(req, res, generateGoogleReviewHTML)
);
app.post("/whatsapp-weekly", (req, res) =>
  handlePDFRequest(req, res, generateWhatsAppWeeklyHTML)
);
app.post("/generate-invoice", (req, res) =>
  handlePDFRequest(req, res, generateInvoiceHTML)
);
app.post("/html-text", (req, res) =>
  handlePDFRequest(req, res, (html) => html)
);

app.get("/pdfs/:id", (req, res) => {
  const pdfPath = path.join(PDF_DIR, `${req.params.id}.pdf`);

  if (fs.existsSync(pdfPath)) {
    return res.sendFile(pdfPath);
  }
  return res.status(404).json({ error: "PDF not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// const generateGoogleReviewPDF = async (htmlContent) => {
//   const browser = await puppeteer.launch({
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     headless: true,
//     timeout: 60000,
//   });

//   const page = await browser.newPage();
//   await page.setContent(htmlContent, {
//     waitUntil: "networkidle2",
//     timeout: 60000,
//   });

//   const pdfBuffer = await page.pdf({
//     format: "A4",
//     printBackground: true,
//     displayHeaderFooter: false,
//     margin: {
//       top: "0px",
//       right: "0px",
//       bottom: "0px",
//       left: "0px",
//     },
//   });

//   await page.close();
//   await browser.close();

//   const pdfId = uuidv4();
//   const pdfPath = path.join(PDF_DIR, `${pdfId}.pdf`);
//   fs.writeFileSync(pdfPath, pdfBuffer);

//   return pdfId;
// };

// app.post("/google-review", async (req, res) => {
//   const data = req.body;

//   if (!data) {
//     return res.status(400).json({ error: "JSON data is required" });
//   }

//   try {
//     const html = generateGoogleReviewHTML(data);

//     const pdfId = await generateGoogleReviewPDF(html);

//     res.json({ url: `${req.protocol}://${req.get("host")}/pdfs/${pdfId}` });
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     res.status(500).json({ error: "Failed to generate PDF" });
//   }
// });

// app.post("/whatsapp-weekly", async (req, res) => {
//   const data = req.body;

//   if (!data) {
//     return res.status(400).json({ error: "JSON data is required" });
//   }

//   try {
//     const html = generateWhatsAppWeeklyHTML(data);

//     const pdfId = await generateGoogleReviewPDF(html);

//     res.json({ url: `${req.protocol}://${req.get("host")}/pdfs/${pdfId}` });
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     res.status(500).json({ error: "Failed to generate PDF" });
//   }
// });

// app.post("/html-text", async (req, res) => {
//   const html = req.body;

//   if (!html) {
//     return res.status(400).json({ error: "HTML content is required" });
//   }

//   try {
//     const browser = await puppeteer.launch({
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//       headless: true,
//       timeout: 60000,
//     });

//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "networkidle2", timeout: 60000 });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       displayHeaderFooter: true,
//     });

//     await page.close();
//     await browser.close();

//     const pdfId = uuidv4();
//     const pdfPath = path.join(PDF_DIR, `${pdfId}.pdf`);

//     fs.writeFileSync(pdfPath, pdfBuffer);

//     res.json({ url: `${req.protocol}://${req.get("host")}/pdfs/${pdfId}` });
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     res.status(500).json({ error: "Failed to generate PDF" });
//   }
// });

// app.get("/pdfs/:id", (req, res) => {
//   const pdfPath = path.join(PDF_DIR, `${req.params.id}.pdf`);

//   if (fs.existsSync(pdfPath)) {
//     return res.sendFile(pdfPath);
//   } else {
//     return res.status(404).json({ error: "PDF not found" });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
