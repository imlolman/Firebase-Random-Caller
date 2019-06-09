function caller(){
  /*
    TODO:
    Add a caller to the collection and give a unique id to self.id
    Add a status of waiting
  */
 
  $('#status').html('Connecting to Server...')
  var self = this;
  self.collection = db.collection('caller')
  self.connecting = db.collection('connecting')
  self.collection.add({
    status: "waiting"
  }).then(function(docRef) {
    self.id = docRef.id
    $('#status').html('Connected to Server, Ready to Call')
  }).catch(function(error) {
      console.error("Error adding document: ", error);
  });

  self.ready = () => {
    /*
      TODO:
      Check Name
      Change the Status of waiting to connecting
      check if there's any free colection in connecting if available run self.join(connectionid)
      Add self.id to new collection named connecting and wait till the status of connecting changes and connectedto node gets some id
      self.startCall(connectionid)
    */
    if(self.id == undefined){
      return false
    }
    if($('#name').val() != ''){
      $('#connectBTN').prop('disabled',true).html('wait..')
      $('#status').html('Calling, Wait...')
      self.collection.doc(self.id).update({
        name: $('#name').val()
      })
      self.connecting.limit(1).get().then(function(querySnapshot) {
        if(querySnapshot.size != 0){
          connectionid = querySnapshot.docs[0].data().id
          connectionname = querySnapshot.docs[0].data().name
          $('#status').html('Connecting to '+connectionname)
          self.collection.doc(connectionid).update({
            status: 'connected',
            connectedto: self.id
          })
          self.collection.doc(self.id).update({
            status: 'connecting',
            connectedto: connectionid
          })
          self.connecting.doc(querySnapshot.docs[0].id).delete().then(function(){
            var listener = self.collection.doc(self.id)
            .onSnapshot(function(doc) {  
              if(doc.data().status == "connected"){
                listener()
                self.join(doc.data().connectedto)
              }
            });
          })
        }else{
          $('#status').html('Connecting...')
          self.connecting.add({
            name: $('#name').val(),
            id: self.id
          })
          var listener = self.collection.doc(self.id)
            .onSnapshot(function(doc) {  
              if(doc.data().connectedto != undefined){
                listener()
                self.collection.doc(doc.data().connectedto).update({
                  status: 'connected'
                })
                self.join(doc.data().connectedto)
              }
          });
        }
    });
    }else{
      alert('Please Fill a Name');
    }
  }

  self.join = (connectionid) => {
    /*
      TODO:
      remove connectionid from connecting collection
      change the status of both ids to connected, exchange node connectedto ids
      self.startCall(connectionid)
    */
   self.connectionid = connectionid
   var listener = self.collection.doc(connectionid).onSnapshot(function(doc){
     $('#status').html('Connected to ' + doc.data().name);
     listener()
     self.startCall(connectionid)
   })
   listen()

  }

  self.startCall = () => {
    /*
      TODO:
      When Message Received, Speak
      - Whenever there is an Append in connectionid's Message Array, Speak 
      When Recording Received, Send
      - Whenever Recording received, append my message Array

      Whenever there is a change in Status of Anyone, Do the Required Accordingly
    */
    var messagelistener = db.collection('caller/' + self.connectionid + '/message').where('read', '==', false).onSnapshot(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            console.log(doc.data().message,doc.data().voice)
            speak(doc.data().message,doc.data().voice)
            db.collection('caller/' + self.connectionid + '/message').doc(doc.id).update({
              read: true
            })
        });
    })
    var statuslistener = self.collection.doc(self.connectionid).onSnapshot(function(doc){
      data = doc.data()
      if(data.status == "disconnected"){
        messagelistener()
        statuslistener()
        self.collection.doc(self.id).update({status: "disconnected"})
        self.endCall()
      }
    })
  }

  self.sendMessage = (msg) => {
    var newPostRef = db.collection('caller/' + self.id + '/message');
    newPostRef.add({
        message: msg,
        read: false,
        voice:  vs[parseInt($('#voice').val())].voiceURI
    });
  }

  self.endCall = () => {
    /*
      TODO:
      Update Status to Disconnected in BOTH
    */
   
   $('#status').html('Disconnected From Call')
   $('#connectBTN').prop('disabled',false).html('Connect a Call')
   console.log('disconnected')
   makeACaller()
  }
}