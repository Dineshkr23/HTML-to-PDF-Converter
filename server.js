require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5003;
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

const generateWhatsAppWeeklyHTML = (data) => `<!DOCTYPE html>
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
        font-size: 14px;
        font-family: "poppins", sans-serif;
      }
      @page {
        size: A4;
        margin: 30px 0 0;
      }
      body {
        background-image: url(https://demo.emovur.com/background-image.png);
        background-repeat: no-repeat;
        object-fit: cover;
        background-position-x: center;
        background-size: contain;
      }

      @media print {
        @page {
          size: A4;
          margin: 30px 0 0;
        }
        body {
          background-image: url(https://demo.emovur.com/background-image.png);
          background-repeat: no-repeat;
          object-fit: cover;
          background-position-x: center;
          background-size: contain;
        }
        .container {
          margin: 10px 20px;
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
        .page-break {
          page-break-before: always;
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
        margin: 50px 0px 30px 20px;
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
        gap: 20px;
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
        background-color: #e6e5e5;
      }
      .individual-broadcast-table td,
      .individual-broadcast-table th {
        padding: 2px 10px;
      }
      .individual-broadcast-table th:nth-child(1) {
        color: #0c9ffa;
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
      #journeyDetailsTable td {
        text-align: center;
      }
      #broadcastDetailsTable td {
        text-align: center;
      }

      /* <!-- Footer --> */
      .footer-report {
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
                <td>${
                  item.type.charAt(0).toUpperCase() + item.type.slice(1)
                }</td>
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
                <td>${
                  item.type.charAt(0).toUpperCase() + item.type.slice(1)
                }</td>
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
        <div class="individual-broadcast-table-head" style="margin-top: 50px">
          <p>Individual broadcasts</p>
        </div>
        <div class="table-container-individual-broadcast">
          <table class="individual-broadcast-table">
            <thead>
              <tr style="background-color: #ffffff">
                <th>Campaign Name</th>
                <th>Date</th>
                <th>Template</th>
                <th>Total Recipients</th>
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
              <tr style="background-color: #ffffff">
                <th>Journey <br />Name <br />Initiated Date <br />& Time</th>
                <th>Date</th>
                <th>Template</th>
                <th>Total <br />Recipients</th>
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
            <div><p id="partnerWebsite">${
              data.partnerDetails.website ? data.partnerDetails.website : ""
            }</p></div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;

const generateGoogleReviewPDF = async (htmlContent) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
    timeout: 60000,
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
  });

  await page.close();
  await browser.close();

  const pdfId = uuidv4();
  const pdfPath = path.join(PDF_DIR, `${pdfId}.pdf`);
  fs.writeFileSync(pdfPath, pdfBuffer);

  return pdfId;
};

app.post("/google-review", async (req, res) => {
  const data = req.body;

  if (!data) {
    return res.status(400).json({ error: "JSON data is required" });
  }

  try {
    const html = generateGoogleReviewHTML(data);

    const pdfId = await generateGoogleReviewPDF(html);

    res.json({ url: `${req.protocol}://${req.get("host")}/pdfs/${pdfId}` });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.post("/whatsapp-weekly", async (req, res) => {
  const data = req.body;

  if (!data) {
    return res.status(400).json({ error: "JSON data is required" });
  }

  try {
    const html = generateWhatsAppWeeklyHTML(data);

    const pdfId = await generateGoogleReviewPDF(html);

    res.json({ url: `${req.protocol}://${req.get("host")}/pdfs/${pdfId}` });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.post("/html-text", async (req, res) => {
  const html = req.body;

  if (!html) {
    return res.status(400).json({ error: "HTML content is required" });
  }

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
      timeout: 60000,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle2", timeout: 60000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
    });

    await page.close();
    await browser.close();

    const pdfId = uuidv4();
    const pdfPath = path.join(PDF_DIR, `${pdfId}.pdf`);

    fs.writeFileSync(pdfPath, pdfBuffer);

    res.json({ url: `${req.protocol}://${req.get("host")}/pdfs/${pdfId}` });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.get("/pdfs/:id", (req, res) => {
  const pdfPath = path.join(PDF_DIR, `${req.params.id}.pdf`);

  if (fs.existsSync(pdfPath)) {
    return res.sendFile(pdfPath);
  } else {
    return res.status(404).json({ error: "PDF not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
