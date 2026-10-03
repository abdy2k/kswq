# KSWQ

Khmer Smart Writer Quill with - On-Screen Keyboard (Word Processor)

A Node.js and Express web application server for **KSWQ**.

---

## 🚀 Features

* Built on **Node.js** and **Express.js** framework
* Dynamic views and templating routing
* Configured static file serving via `/public`
* Modular directory structure for routes, logic, and views

---

## 📁 Project Structure

```text
kswq/
├── bin/            # Server launch scripts & executables (www)
├── public/         # Static assets (CSS, JS, Images)
├── routes/         # Express route handlers
├── views/          # Template views / UI layouts
├── app.js          # Core Express application setup
├── package.json    # Dependencies & project scripts
└── .gitignore      # Git exclusion rules

git clone [https://github.com/abdy2k/kswq.git](https://github.com/abdy2k/kswq.git)
cd kswq

npm install

npm start

npx nodemon ./bin/www

pm2 start ./bin/www --name "kswq"

### How to add this `README.md` to your GitHub repository:

Run these commands on your server inside `/var/www/kswq`:

```bash
# Create or overwrite README.md using nano or vim
nano README.md

# Stage, commit, and push the new README to GitHub
git add README.md
git commit -m "Add project README.md"
git push

<img width="920" height="392" alt="image" src="https://github.com/user-attachments/assets/021338f3-7e76-4dac-b0b6-56772f5f582e" />

