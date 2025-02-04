# URL Shortener app

# Setup Instructions

## 1. Install Dependencies
Run `npm install` in the projecy directory

## 2. create .env file with variable
- `clientId = " "` :- for google oauth 2.0
- `clientSecret = " "` :- for google oauth 2.0

## 3. Start Server

run in terminal :

- `npm start`

# Test API through postman

## 1. Set Up OAuth 2.0 in Postman

- Authorization Tab Settings:
    
    - Authorization Type: Select OAuth 2.0 from the dropdown menu under the Authorization tab.

- Configure OAuth 2.0 Details:
    - Token Name :- Google oauth

    - Grant Type :- Authorization code

    - Callback URL :- http://localhost:8000/auth/google/redirect

    - Auth URL :- https://accounts.google.com/o/oauth2/auth

    - Access Token URL :- https://oauth2.googleapis.com/token

    - Client ID :- "Your client ID for google login"

    - Client Secret :- "Your client secret for google login"

    - Scope :- https://www.googleapis.com/auth/userinfo.profile

    - Client Authentication :- send as basic auth header


- Once you've entered all the details, click the Get New Access Token button.
- use this access token in your API request.

## 2. API calls

- http://localhost:8000/api/shorten :- generate short URL

    - Method: POST

    - Request Body: send through form-urlencoded

        - `longUrl` (string): The original URL to be shortened.
        - `customAlias` (string, optional): A custom alias for the short URL
        - `topic` (string, optional): A category under which the short URL is grouped 

    - Authorization Type Select as OAuth 2.0

   - Response:
        - shortUrl (string): The generated short URL.
        - createdAt (datetime): The timestamp indicating when the short URL was created.
    - Rate Limiting: Implement rate limiting to restrict 2 requests per minute per user

- http://localhost:8000/api/shorten/{alias} :- redirect short URL to original url

    - Method: GET

    - Response: Redirect the user to the original long URL

    - Analytics Tracking :- save data in database required for analytics

- http://localhost:8000/api/analytics/{alias} 

    - Method: GET

    - Description: Retrieve detailed analytics for a specific short URL, providing insights into its performance, including total clicks and unique audience interactions.

- http://localhost:8000/api/analytics/topic/{topic}

    - Method: GET

    - Description: Retrieve analytics for all short URLs grouped under a specific topic, allowing users to assess the performance of their links based on categories.

- http://localhost:8000/api/analytics/overall

    - Method: GET

    - Description: Retrieve overall analytics for all short URLs created by the authenticated user, providing a comprehensive view of their link performance.

    - Authorization Type Select as OAuth 2.0


## Architecture

## 1) Google Login via OAuth 2.0 Authentication

This application implements user authentication through Google Login using OAuth 2.0. The authentication flow is handled by Passport.js with the passport-google-oauth20 strategy. To set up Google login, you'll need to create OAuth credentials in the Google Cloud Console, which will provide the clientID and clientSecret required for the integration.

The authentication flow consists of two main routes:

- `/auth/google` : This route triggers the Google login process by redirecting users to Google’s authentication page, where they can log in and grant necessary permissions.

- `/auth/google/redirect` : Once the user logs in, Google redirects them to this route, where Passport.js handles the OAuth callback. The user’s profile information is then retrieved, and if the user is not already registered, a new user is created in the database. If they are an existing user, their profile is retrieved, and the session is initialized.


## 2) Getting User Info from Google

In this project, we use the axios library to retrieve user information from Google after obtaining an access token. The access token is typically acquired through the Google OAuth 2.0 flow. Once the user is authenticated, we send the token to Google's API to fetch user details like their name, email, and profile picture.

## 3) Redis Integration

In this project, we use Redis as an in-memory data store to store and manage mappings between long URLs, their corresponding aliases, and the user's IP address. Redis helps us efficiently manage URL shortening and enables quick access to this data, ensuring optimal performance.