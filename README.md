<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ec0f4b18-abbf-45e7-a8cd-ec8b4f40f7f7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` if you use Gemini-powered features
3. Run the app:
   `npm run dev`

## Firebase

This app is connected to the Firebase project `betterme-fb488` through the existing web app `betterme-web`.

- Firebase project alias is stored in `.firebaserc`
- Firebase Hosting is configured in `firebase.json`
- Frontend Firebase SDK config is loaded from `.env.local`
- Dashboard data is mirrored from `localStorage` to Firestore document `dashboards/off-white-dashboard`

Deploy with:

`npm run build`

`firebase deploy`
