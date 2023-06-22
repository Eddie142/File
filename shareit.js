$(document).ready(function () {
  $("a#pageLink").click(function () {
    $("a#pageLink").removeClass("active");
    $(this).addClass("active");
  });

  $(".btn-show-left-area").click(function () {
    $(".left-area").removeClass("show");
    $(".left-area").addClass("show");
  });

  $(".btn-show-right-area").click(function () {
    $(".right-area").removeClass("show");
    $(".right-area").addClass("show");
  });

  $(".btn-close-right").click(function () {
    $(".right-area").removeClass("show");
  });

  $(".btn-close-left").click(function () {
    $(".left-area").removeClass("show");
  });
});

$('.main-area').scroll( function() {
    if ($('.main-area').scrollTop() >= 88) {
       $('div.main-area-header').addClass('fixed');
    }
    else {
       $('div.main-area-header').removeClass('fixed');
    }
    console.log("File Transfer System");
})
var fileInput = document.getElementById('file-input');
      var sendButton = document.getElementById('send-button');
      var progressBar = document.querySelector('.progress-bar');
      var statusDiv = document.querySelector('.status');

      // Disable the send button until a file is selected
      fileInput.addEventListener('change', function() {
        sendButton.disabled = false;
      });

      // Handle the send button click event
      sendButton.addEventListener('click', function() {
        var file = fileInput.files[0];
        var fileReader = new FileReader();

        // Update the status message
        statusDiv.innerHTML = 'Preparing to send file...';

        // Create a peer-to-peer connection
        var peer = new RTCPeerConnection();

        // Create a data channel for transferring files
        var dataChannel = peer.createDataChannel('file-transfer');

        // Send file data when the data channel is open
        dataChannel.onopen = function() {
          // Update the status message
          statusDiv.innerHTML = 'Sending file...';

          // Send the file name
          dataChannel.send(file.name);

          // Send the file data
          var chunkSize = 16384;
          var offset = 0;

          var sendChunk = function() {
            var reader = new FileReader();
            reader.onload = function() {
              dataChannel.send(reader.result);
              offset += reader.result.byteLength;
              progressBar.style.width = ((offset / file.size) * 100) + '%';

              if (offset < file.size) {
                sendChunk();
              } else {
                // Update the status message
                statusDiv.innerHTML = 'File transfer complete.';
              }
            };
            var slice = file.slice(offset, offset + chunkSize);
            reader.readAsArrayBuffer(slice);
          };
          sendChunk();
        };

        // Handle errors on the data channel
        dataChannel.onerror = function(error) {
          console.error('Data channel error:', error);
        };

        // Create an offer and set it as the local description
        peer.createOffer().then(function(offer) {
          return peer.setLocalDescription(offer);
        }).then(function() {
          // Display the offer to the user for sharing
          var offerString = btoa(JSON.stringify(peer.localDescription));
          var shareURL = window.location.href.split('?')[0] + '?offer=' + offerString;
          statusDiv.innerHTML = 'Share this URL with the recipient: <a href="' + shareURL + '">' + shareURL + '</a>';
        }).catch(function(error) {
          console.error('Error creating offer:', error);
        });
      });

      // Handle the offer parameter in the URL
      var offerParam = new URLSearchParams(window.location.search).get('offer');
      if (offerParam !== null) {
        // Update the status message
        statusDiv.innerHTML = 'Receiving file...';

        // Decode the offer parameter and set it as the remote description
        var offer = JSON.parse(atob(offerParam));
        var peer = new RTCPeerConnection();
        peer.setRemoteDescription(new RTCSessionDescription(offer));

        // Create a data channel for receiving files
        var dataChannel = peer.createDataChannel('file-transfer');

        // Receive file data when the data channel receives a message
        var receivedSize = 0;
        var fileSize = null;
        var receivedFileData = [];

        dataChannel.onmessage = function(event) {
          if (fileSize === null) {
            // Read the file size from the first message
            fileSize = parseInt(event.data);
          } else {
            // Append the file data to the receivedFileData array
            receivedFileData.push(event.data);
            receivedSize += event.data.byteLength;
            progressBar.style.width = ((receivedSize / fileSize) * 100) + '%';

            if (receivedSize === fileSize) {
              // Concatenate the received file data into a single ArrayBuffer
              var receivedFile = new Uint8Aray(receivedSize);
              var offset = 0;
              for (var i = 0; i < receivedFileData.length; i++) {
                receivedFile.set(new Uint8Array(receivedFileData[i]), offset);
                offset += receivedFileData[i].byteLength;
              }

              // Create a blob from the received file data and download it
              var blob = new Blob([receivedFile]);
              var downloadLink = document.createElement('a');
              downloadLink.href = URL.createObjectURL(blob);
              downloadLink.download = file.name;
              downloadLink.click();

              // Update the status message
              statusDiv.innerHTML = 'File transfer complete.';
            }
          }
        };

        // Send a message to the sender to initiate the file transfer
        dataChannel.send('ready');
      };