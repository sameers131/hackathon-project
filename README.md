# Hackathon Project – AI News Hub
Overview

AI News Hub is a full-stack news aggregation platform built with a custom Node.js backend and vanilla JavaScript frontend. The application securely proxies NewsAPI requests through a manually implemented TCP-based HTTP server to protect API credentials while dynamically rendering categorized news content in the browser.

# Key Technical Highlights

Custom HTTP server built using Node’s net module (no Express)

Manual HTTP request parsing and routing

Secure API key management via environment variables (dotenv)

Backend proxy pattern to prevent client-side credential exposure

Asynchronous request handling using Promises and async/await

Client-side sentiment analysis engine for article classification

Dynamic DOM rendering and Fetch API integration

Browser-based text-to-speech using Web Speech API

System Architecture

# Frontend:

HTML / CSS / Vanilla JavaScript

Fetch API for backend communication

Real-time DOM updates

Custom sentiment scoring logic

# Backend:

Node.js

TCP socket server (net.createServer)

Manual HTTP header parsing

REST-style route handling (/api/news)

External API integration (NewsAPI)

# Video Link
https://youtu.be/l4rZc9HtCFE
