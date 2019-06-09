var me
var stopListening = false
var vs = []
function setup(){
  var fb = firebase.initializeApp(keys);
  db = fb.firestore()
  makeACaller()

  window.speechSynthesis.onvoiceschanged = function() {
    voices = window.speechSynthesis.getVoices();
    vs = voices
    voices.forEach((voice,index) => {
      // console.log(voice.name,index)
      $('#voice').append('<option value="'+index+'">'+voice.name+'</option>');
    });
  };
}

function makeACaller(){
  me = new caller()
}

function searchVoice(name){
  p = vs[0]
  vs.forEach(v=>{
    if(v.voiceURI == name){
      p = v
    }
  })
  return p
}

function speak(text, lang){
  var utter = new SpeechSynthesisUtterance();
  utter.rate = 1;
  utter.pitch = 0.5;
  utter.text = text;
  utter.voice = searchVoice(lang);

  window.speechSynthesis.speak(utter);
}



function listen(){
  window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  if ('SpeechRecognition' in window) {
    const recognition = new window.SpeechRecognition();
    recognition.onresult = (event) => {
      var speechToText = event.results[0][0].transcript;
      me.sendMessage(speechToText)
    }
    var flag = true
    recognition.onsoundend = function() {
      if(!stopListening){listen()}
      flag = false
    }
    recognition.onend = function() {
      if(flag){
        if(!stopListening){listen()}
      }
    }
    recognition.start();
  } else {
    console.log('speech recognition API not supported')
  }
}

function stopListening(){
  stopListening = true
}