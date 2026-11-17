# TaskFlow – MERN Stack CRUD Project (Beginner Friendly)

Ye aapka first MERN project hai. Isme aap **Task create, read, update aur delete** kar sakte hain. Data MongoDB Atlas cloud database me save hoga.

## 1. Project me kya hai?

- **Create:** Naya task add karna
- **Read:** Saare tasks dekhna
- **Update:** Existing task edit karna
- **Delete:** Task remove karna
- Search aur status filter
- Har task ke saath employees, unka assigned kaam aur individual progress
- Task list me employee count; task kholne par individual aur average overall progress
- Task ke liye local date/time par meeting schedule aur one-click Jitsi video call
- Demo team panel: 1 admin, 1 manager aur 5 employees ke sample profiles/tasks
- Demo CRUD browser ke `localStorage` me save hota hai; live MongoDB data se alag
- Responsive frontend
- MongoDB Atlas connection

## Demo workspace aur roles

Header me **Try demo** click karke demo workspace kholein. Isme admin, manager aur 5 employees ke sample profiles aur website project tasks diye gaye hain. Team card ya **Preview as** dropdown se role badal sakte hain:

- **Admin / Manager:** demo tasks create, edit aur delete kar sakte hain.
- **Employee:** sirf apne assigned tasks aur progress dekh sakta hai; changes nahi kar sakta.

Demo task changes isi browser ki `localStorage` me persist hote hain. Browser data clear karne par demo changes mit jayenge. **Live database** button se MongoDB workspace par wapas ja sakte hain; demo changes MongoDB me copy nahi hote. Ye role selector sirf UI preview hai, login/authentication ya secure authorization nahi. Real users ke liye server-side authentication aur authorization alag se banana hoga.

## 2. Required software

1. Node.js LTS – https://nodejs.org/
2. VS Code – https://code.visualstudio.com/
3. MongoDB Atlas account – https://www.mongodb.com/atlas

Node aur npm check karne ke liye VS Code terminal me:
```bash
node -v
npm -v
```

## 3. MongoDB Atlas setup (important)

1. https://cloud.mongodb.com/ par sign in/sign up karein.
2. Free cluster create karein.
3. **Database Access** me jaakar ek database user banayein. Username aur password note karein.
4. **Network Access** me apna current IP address allow karein. Sirf learning/testing ke liye temporary `0.0.0.0/0` allow kar sakte hain; production me ise avoid karein.
5. Cluster ke **Connect** button par click karein.
6. **Drivers** select karein, Node.js choose karein aur connection string copy karein.
7. `server` folder me `.env.example` ki copy banakar uska naam `.env` rakhein.
8. `.env` file me `MONGO_URI` ki value apni Atlas connection string se replace karein.

Example:
```env
PORT=5000
MONGO_URI=mongodb+srv://myUser:myPassword@cluster0.xxxxx.mongodb.net/mern_crud_db?retryWrites=true&w=majority
```

`myUser`, `myPassword` aur cluster address ko apni actual details se replace karein. Agar password me `@`, `#`, `/`, `:` jaise special characters hain, password ko URL-encode karna hoga. `.env` ko kisi ke saath share mat karein aur GitHub par upload mat karein.

## 4. Frontend aur backend ko alag-alag run kaise karein?

ZIP extract karke `mern-crud-beginner` project folder VS Code me open karein. Root folder wahi hai jisme main `package.json` hai. Agar terminal `MERN_CRUD_TaskFlow_Beginner` parent folder me ho, pehle `cd .\mern-crud-beginner` chalayein.

### Step A – Dependencies install
```bash
npm run install:all
```

### Step B – Backend config
Confirm karein ki `server/.env` file bani hui hai aur usme correct MongoDB Atlas URI hai.

### Step C – Backend start
Ek terminal me:
```bash
npm run dev:backend
```

Backend API `http://localhost:5000` par chalegi.

### Step D – Frontend start
VS Code me **naya terminal** kholkar:
```bash
npm run dev:frontend
```

Frontend `http://localhost:5173` par kholein. CRUD use karne ke liye dono terminals chalte rehne chahiye. Backend terminal me `MongoDB connected` aur `Server running at http://localhost:5000` dikhna chahiye.

### Optional – Dono ek saath start karein
```bash
npm run dev
```

Combined dev command Node se backend aur frontend ko seedha launch karta hai; isliye Windows me `concurrently`/`cmd.exe` ki dependency nahi hai. `npm run dev:backend` aur `npm run dev:frontend` bhi isi shell-free launcher se chalayein.

## 5. Folder structure samjhein

```text
mern-crud-beginner/
├── client/                 # Frontend: React + Vite
│   └── src/
│       ├── App.jsx         # Screen + CRUD actions
│       ├── main.jsx        # React entry point
│       └── style.css       # Design / responsive CSS
├── server/                 # Backend: Node + Express + MongoDB
│   ├── config/db.js        # MongoDB connection
│   ├── controllers/        # CRUD logic
│   ├── models/Task.js      # MongoDB Task schema
│   ├── routes/             # API routes
│   ├── .env.example        # Environment template
│   └── server.js           # Backend entry point
├── scripts/
│   └── dev.cjs             # Windows-safe frontend/backend launcher
├── package.json
└── README_HINGLISH.md
```

Frontend aur backend ke dependencies aur `package.json` alag hain. Unhe independently chalane ke liye project root se `npm run dev:frontend` ya `npm run dev:backend` use karein; ya respective folder (`client`/`server`) me jaakar `npm run dev` chalayein.

## 6. CRUD API endpoints

| Method | URL | Kaam |
|---|---|---|
| GET | `/api/tasks` | Saare tasks lana |
| POST | `/api/tasks` | Naya task banana |
| PUT | `/api/tasks/:id` | Task update karna |
| DELETE | `/api/tasks/:id` | Task delete karna |

Backend controller tests project folder se chalane ke liye:
```bash
npm --prefix server test
```

Example task data:
```json
{
  "title": "Learn MongoDB",
  "description": "Practice Atlas connection",
  "status": "In Progress",
  "meetingAt": "2026-11-18T05:30:00.000Z",
  "teamMembers": [
    {
      "name": "Rahul Sharma",
      "responsibility": "Frontend development",
      "progress": 60
    },
    {
      "name": "Priya Verma",
      "responsibility": "Backend and database",
      "progress": 40
    }
  ]
}
```

`teamMembers` optional hai. Har member ka `progress` 0 se 100 ke beech hota hai. Overall progress assigned members ke progress ka simple average hai; jaise 60% aur 40% ka average 50% hoga. Task list me sirf employee count dikhta hai; task par click karke member-wise details aur overall progress dekhein. Kisi task ko edit karke employees add/remove karein ya unka kaam/progress update karein.

`meetingAt` optional ISO date/time hai. Form browser ke local time zone ka date/time leta hai aur server use UTC date ke roop me save karta hai; task card par local date/time dikhega. Date/time set karte hi ek unique Jitsi room banega. Task card ke **Join call** button se meeting join karein ya copy icon se link team ke saath share karein. Jitsi public service hai; link paane wala koi bhi join kar sakta hai, isliye confidential meeting links share na karein.

## 7. Common errors aur solutions

**MONGO_URI is missing**
- Check karein `server/.env` file ka naam exactly `.env` hai, `.env.txt` nahi.
- File `server` folder ke andar honi chahiye.
- Backend `server/.env` ko launch directory se independent load karta hai.

**MONGO_URI still contains a placeholder**
- `server/.env` me `<db_password>` ya kisi bhi `<...>` text ko apni actual MongoDB Atlas details se replace karein.

**MongoServerError: Authentication failed**
- Database Access username/password check karein.
- Atlas database user ka password use karein, MongoDB website login password nahi.
- Special characters URL-encode karein.

**Could not connect / IP not allowed**
- Atlas → Network Access me current IP add karein.
- Internet connection check karein.

**Port 5000 already in use**
- `server/.env` me `PORT=5001` kar sakte hain. Is case me frontend `client/src/App.jsx` me API_URL ka port bhi 5001 karein.

**Frontend par Network Error**
- Backend terminal check karein.
- MongoDB connection successful hona chahiye.
- Dono terminals chal rahe hone chahiye.

**`spawn cmd.exe ENOENT` while running `npm run dev`**
- Confirm karein terminal project root (`mern-crud-beginner`) ke andar hai.
- Updated project me `scripts/dev.cjs` launcher use hota hai aur `concurrently`/`cmd.exe` ki zaroorat nahi.
- Dependencies missing hon to project root se `npm run install:all` chalayein.

## 8. First time use

1. Title likhein.
2. Description optional hai.
3. Status choose karein.
4. Add task click karein.
5. Meeting schedule karni ho to date aur time set karein; optional hai.
6. Team members section me Add button se employees jodein, unka assigned kaam aur progress bharein. Employee assign karna optional hai.
7. Task list me employee count dikhega. Task par click karke har employee ka kaam/progress aur overall average dekhein.
8. Scheduled task par Join call se video meeting join karein, ya copy icon se Jitsi link share karein.
9. Edit aur Delete icons se task, meeting ya assigned employees update karein.
10. Live mode me page refresh karke check karein – task, team aur meeting date database me saved rehni chahiye. Demo mode me changes isi browser me saved rehte hain, MongoDB me nahi.

## Important security note

Real Atlas username/password sirf apni local `server/.env` file me rakhein. Is project me `.env` Git ignore ki gayi hai. Apni actual database credentials chat me bhi share na karein.
