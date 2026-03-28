# Vettly

Vettly is a tender compliance assistant for procurement and bid-evaluation teams.

It helps you move from long, hard-to-read RFP files to a structured review flow where requirements, compliance checks, and risks can be tracked clearly.

## What This Project Does

Vettly is designed to support these outcomes:

- Collect RFP documents in one place
- Extract readable text from uploaded RFP PDFs
- Prepare requirement-by-requirement evaluation workflows
- Compare vendor responses against tender expectations
- Surface potential risks early for faster decisions

## Who It Is For

- Procurement teams managing multiple bids
- Legal/commercial reviewers validating contractual alignment
- PMO and leadership teams that need transparent vendor comparison

## How To Use Vettly

Use Vettly as an operating workflow rather than a single upload tool.

1. Create or open a tender review
2. Enter a clear project name
3. Upload the RFP file
4. Review extracted content for completeness
5. Use the extracted content as the baseline for compliance checks
6. Continue with proposal review, risk checks, and comparison views

## Current Working Flow

At the current stage, the most complete flow is the RFP intake path.

- The main page allows users to start a new tender review and upload an RFP
- The backend provides an RFP upload endpoint that accepts PDF files
- Uploaded PDF content is parsed and returned as structured response data

This enables a reliable first step in the larger tender-compliance lifecycle.

## Expected Upload Behavior

When uploading an RFP PDF:

- Non-PDF files are rejected
- Empty or non-extractable PDFs are rejected
- Oversized files are rejected
- Valid PDFs return filename, extracted text, page count, and upload timestamp

## Practical Usage Tips

- Use clear project names so reviews remain searchable
- Prefer text-based PDFs for best extraction quality
- Keep source documents clean and final before upload
- Use extracted output as the reference point for all later validation work

## Product Direction

Vettly is being delivered in phases, with RFP ingestion completed first and the remaining tender-validation experience expanding step by step.

The end goal is a single review workspace from RFP intake to final vendor decision.