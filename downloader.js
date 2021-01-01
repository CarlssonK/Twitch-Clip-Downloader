const axios = require("axios")
const { exec } = require('child_process');
const schedule = require("node-schedule")
//to get directory path
const path = require('path');
const fs = require('fs');

let userClips = [];
let gameClips = [];
let userCounter = 0;
let gameCounter = 0;
let isUserClipsFetched = false;
let isGameClipsFetched = false;
let clipsPath = 0;

const fetchClips = async () => {
  // Befor fetching clips reset everything to normal
  userClips = [];
  gameClips = [];
  userCounter = 0;
  gameCounter = 0;
  isUserClipsFetched = false;
  isGameClipsFetched = false;
  clipsPath = 0;
  makeFolder()
  console.log(`FETCHING CLIPS...`)
  try {
    // First fetch access token so we can use the API
    const res = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`)
    const token = res.data.access_token;
    // Chain of multiple functions, in the end, returns big list of top categoriy/game clips
    fetchTopGames(token);
    // Chain of multiple functions, in the end, returns big list of top user clips
    fetchHandPickedUsers(token);
  } catch(err) {
    console.error("ERROR!", err)
  }
}


// ############ CONFIGURATION ############

// Create an application on https://dev.twitch.tv/console to get your client id and client secret
const clientId = "your_client_id_here"
const clientSecret = "your_client_secret_here" // note your client secret is private thus should not be shown to other people

// EXECUTION TIMES (Schedule when to download)
schedule.scheduleJob({hour: 0, minute: 0}, function(){ // this fetches the top clips every day 00:00
  // fetchClips()
});
// or just call "fetchClips()" if you want to download directly
fetchClips()

// Choose clips amount:
let clipsAmount = 5; // this will download top 5 clips to your "CLIPS" folder

// Choose date:
let clipsDate = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString(); // From when clip was created, 24 Hours ago
// let clipsDate = new Date(new Date().getTime() - (168 * 60 * 60 * 1000)).toISOString(); // From when clip was created, 7 days ago
// let clipsDate = new Date(new Date().getTime() - (720 * 60 * 60 * 1000)).toISOString(); // From when clip was created, 30 Days ago
// let clipsDate = new Date(new Date().getTime() - (8760 * 60 * 60 * 1000)).toISOString(); // From when clip was created, 1 Year ago

let outputPath = `${__dirname}\\CLIPS` // If you want to change output path make sure that the "youtube-dl.exe" file is included

// ############ CONFIGURATION ############





// ########## FETCH GAMES ##########

const fetchTopGames = async (token) => {
  try {
    const config = {
      headers:{
        "Authorization": `Bearer ${token}`,
        "Client-Id": clientId
      }
    }
    const res = await axios.get('https://api.twitch.tv/helix/games/top?first=20', config)
    const gameIdList = [];
    for(let game of res.data.data) {
      gameIdList.push(game.id)
    }
    getAllGameClips(token, gameIdList)
  } catch(err) {
    console.error("ERROR!", err)
  }
}

const getAllGameClips = (token, gameIdList) => {
  // Se we can excecute another function right after lastIndex is fetched
  const gameListLength = gameIdList.length;
  for(let i = 0; i < gameIdList.length; i++) {
    // Excecute this function for every gameId
    fetchTopGameClipsOfTheDay(token, gameIdList[i], gameListLength)
  }
}

const fetchTopGameClipsOfTheDay = async (token, gameId, gameListLength) => {
  try {
    const config = {
      headers:{
        "Authorization": `Bearer ${token}`,
        "Client-Id": clientId
      }
    }
    const res = await axios.get(`https://api.twitch.tv/helix/clips?game_id=${gameId}&started_at=${clipsDate}`, config)
    for(let i = 0; i < 20; i++) {
      if(res.data.data[i] === undefined) continue;
      // Push top 5 clips and its views from a user
      gameClips.push({url: res.data.data[i].url, views: res.data.data[i].view_count})
    }
    // Below code checks if the userClips is fetched, if its true, execute Combine funciton
    gameCounter++;
    if(gameCounter === gameListLength) {
      isGameClipsFetched = true;
      if(isUserClipsFetched === true) Combine(gameClips, userClips);
    }

  } catch(err) {
    console.error("ERROR!", err)
  }
}



// ########## FETCH USERS ##########

const fetchHandPickedUsers = async (token) => {
  try {
    const config = {
      headers:{
        "Authorization": `Bearer ${token}`,
        "Client-Id": clientId
      }
    }
    const res = await axios.get('https://api.twitch.tv/helix/users?login=xQcOW&login=shroud&login=Myth&login=Pokimane&login=sodapoppin&login=summit1g&login=NICKMERCS&login=TimTheTatman&login=loltyler1&login=Symfuhny&login=Lirik&login=Anomaly&login=Asmongold&login=Mizkif&login=HasanAbi&login=ludwig&login=moistcr1tikal&login=MitchJones&login=Nmplol&login=JakenBakeLIVE&login=Knut&login=Maya&login=pokelawls&login=itssliker&login=EsfandTV&login=erobb221&login=drdisrespect', config)
    const userIdList = [];
    for(let user of res.data.data) {
      userIdList.push(user.id)
    }
    getAllUserClips(token, userIdList)
  } catch(err) {
    console.error("ERROR!", err)
  }
}

const getAllUserClips = (token, userIdList) => {
    // Se we can excecute another function right after lastIndex is fetched
    const userListLength = userIdList.length;
  for(let i = 0; i < userIdList.length; i++) {
    // Excecute this function for every userId
    fetchTopClipsOfTheDay(token, userIdList[i],userListLength)
  }
}

const fetchTopClipsOfTheDay = async (token, userId, userListLength) => {
  try {
    const config = {
      headers:{
        "Authorization": `Bearer ${token}`,
        "Client-Id": clientId
      }
    }
    const res = await axios.get(`https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&started_at=${clipsDate}`, config)
    for(let i = 0; i < 10; i++) {
      if(res.data.data[i] === undefined) continue;
      // Push top 5 clips and its views from a user
      userClips.push({url: res.data.data[i].url, views: res.data.data[i].view_count})
    }
    // Below code checks if the gameClips is fetched, if its true, execute Combine funciton
    userCounter++;
    if(userCounter === userListLength) {
      isUserClipsFetched = true;
      if(isGameClipsFetched === true) Combine(gameClips, userClips);
    }

  } catch(err) {
    console.error("ERROR!", err)
  }
}

// ########## COMBINE USERS&GAMES AND SEND TO SERVER ##########


const Combine = (gameClips, userClips) => {
  // Merges gameClips and userClips together
  const arr = [...gameClips, ...userClips]

  // Filter outs duplicates
  const seen = new Set();
  const clipsNoDuplicate = arr.filter(el => {
  const duplicate = seen.has(el.url);
  seen.add(el.url);
  return !duplicate;
  });
  // Sort clips from most viewed to least viewed
  const clipsSort = clipsNoDuplicate.sort((a, b) => (a.views < b.views) ? 1 : -1)
  // Return the first 5 clips
  const clipsReady = clipsSort.slice(0, clipsAmount);

  for(let i = 0; i < clipsAmount; i++) {
    downloadClip(clipsReady[i].url)
  }
  console.log(`DOWNLOADING CLIPS...`)
}



// Download the actual clips
function downloadClip(url) {
  exec(`youtube-dl.exe -f best ${url}`, {cwd: `${outputPath}/${clipsPath}`}, (err, stdout, stderr) => {
  if (err) return;
  // the *entire* stdout and stderr (buffered)
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
  });
}


function makeFolder() {
  clipsPath = 0;
  // Finds what the folder name should be called (in this case its integers that increments)
  fs.readdir(`${outputPath}`, function (err, files) {
    if (err) return console.log('Unable to scan directory: ' + err);

    //listing all files using forEach
    files.forEach(function (file) {
        // console.log(file);
        clipsPath++
    });
    setPath()
  });
}
// Create a new folder for the clips
function setPath() {
  exec(`mkdir ${clipsPath}`, {cwd: `${outputPath}`}, (err, stdout, stderr) => {
  if (err) return;
  // the *entire* stdout and stderr (buffered)
  console.log(`Standard Output: ${stdout}`);
  console.log(`Standard Error: ${stderr}`);
  });
} 