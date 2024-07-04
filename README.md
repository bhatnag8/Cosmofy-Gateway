## Available Scripts

In the project directory, you can run:

`docker-compose down && docker-compose build && docker-compose up -d`

Runs the app in the development mode.\
Open [http://localhost:9222](http://localhost:9222) to view it in the browser.

Files needed in directory from App Store Connect:

1. `.env` with variables `KEY_ID`, `ISSUER_ID`, and `VENDOR_NUMBER`
2. `backend/src/AuthKey_XXXXXXXXXX.p8`


Next Steps:
1. Complete Developer Portal
2. Authentication using PassportJS (framework not confirmed)
3. Seperate Main Website from Developer Portal
4. CI/CD to AWS using GitHub Actions
5. Domain Mapping to AWS
