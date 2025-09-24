# Quick.ai

Quick.ai helps people create content using artificial intelligence. You can write articles, make blog titles, generate images, remove backgrounds, and get resume feedback.

## Prerequisites

❖ **Install NodeJs** ( Ignore If Already Installed) 
1. Visit the official Node.js website: https://nodejs.org/en/download/ 
2. Download the Node.js installer 
3. Run the installer

— **First Run Server then Client** — 

## Server Setup

❖ **Steps to setup Server of the project**

1. Open Project Folder In VS Code 

2. **Setup Neon Database**  
   Link: https://neon.com  

3. **Create Database Table using SQL Editor**
   ```sql
   CREATE TABLE creations ( 
   id SERIAL PRIMARY KEY, 
   user_id TEXT NOT NULL, 
   prompt TEXT NOT NULL, 
   content TEXT NOT NULL, 
   type TEXT NOT NULL, 
   publish BOOLEAN DEFAULT FALSE, 
   likes TEXT[] DEFAULT '{}', 
   created_at TIMESTAMPTZ DEFAULT NOW(), 
   updated_at TIMESTAMPTZ DEFAULT NOW() 
   );
   ```

4. **Setup Cloudinary**  
   Link: https://cloudinary.com/users/register_free 

5. **Setup Clerk**  
   Link: https://clerk.com/ 

6. **Setup Clipdrop API**  
   Link: https://clipdrop.co/apis 

7. **Setup Gemini API**  
   Link: https://aistudio.google.com/apikey 

8. Open "server" folder in integrated terminal  

9. **Install Dependencies** using command:  
   ```bash
   npm install
   ```

10. **Run Server** Using Command:  
    ```bash
    npm run server
    ```

>>> **Before Running Client Projects make sure Server is Running**

## Client Setup

❖ **Steps To Run Client of The Project**

1. Open Client Folder in Integrated Terminal 

2. Add Environment Variables  

3. **Install Dependencies** Using Command:
   ```bash
   npm install
   ```

4. **Run Project** Using Command:  
   ```bash
   npm run dev
   ```

## Technology Stack

Built with React and Node.js. Uses Stripe for payments.

## Developers

Saurabh Yadav, Kunal Shekhawat, Prit Baldaniya