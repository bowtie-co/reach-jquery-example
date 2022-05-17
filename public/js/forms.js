$(document).ready(function () {
  // var apiUrl = 'https://reach-api.bowtie.dev';
  var apiUrl = 'https://api.staging.dispatch.social';
  var registerUserUrl = apiUrl + '/users';
  var loginUserUrl = apiUrl + '/users/login';
  var postFileUrl = apiUrl + '/posts';

  var $registerForm = $('#register');
  var $uploadForm = $('#upload-file');
  var $thankYou = $('#thank-you')
  var alertUpload = "<div id='alert-upload' class='mt-3 alert alert-danger alert-dismissible fade show' role='alert'>" + 
            "Unable to register/login, please try again. <button type='button' class='btn-close' data-bs-dismiss='alert' aria-label='Close'></button>" +
            "</div>"
  var uploadAlert = "<div id='alert-upload' class='mt-3 alert alert-danger alert-dismissible fade show' role='alert'>" + 
              "Unable to upload the file, please try again. <button type='button' class='btn-close' data-bs-dismiss='alert' aria-label='Close'></button>" +
              "</div>"

  $uploadForm.hide();
  $thankYou.hide();

  $('form#register-form').on('submit', function(e) {
    e.preventDefault();

    var formData = {};
    var formFields = [ 'name', 'email', 'phone' ];

    for (var i = 0; i < formFields.length; i++) {
      var fieldName = formFields[i];
      var $fieldElement = $(this).find('*[name=' + fieldName + ']');

      if ($fieldElement) {
        formData[fieldName] = $fieldElement.val();
      }
    }

    console.log('payload data', formData);

    fetch(registerUserUrl, {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(resp => resp.json()).then(resp => {
      if (resp) {
        fetch(loginUserUrl, {
          method: 'POST',
          body: JSON.stringify(resp),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }).then(resp => resp.json()).then(resp => {
          if (resp) {
            console.log('token?', resp.token)
            window.localStorage.setItem('authToken', resp.token);
            $registerForm.hide();
            $uploadForm.show();
          }
        }).catch(err => {
          $('.container').append(alertUpload);
        });
      } else {
        $('.container').append(alertUpload);
      }
    }).catch(err => {
      $('.container').append(alertUpload);
    });

    return false;
  });

  $('form#upload-form').on('submit', function(e) {
    e.preventDefault();

    var file = null;
    var $form = $(this);
    var authToken = window.localStorage.getItem('authToken');
    var $formUpload = $form.find('input[type="file"]');

    var submitBody = {};

    if ($formUpload && $formUpload[0] && $formUpload[0].files.length > 0) {
      if ($formUpload[0].files.length > 1) { console.warn('Multiple file uploads not yet supported.'); }

      file = $formUpload[0].files[0];

      var filename = Date.now().toString() + '.' + file.name;

      if (typeof window.slugify === 'function') {
        filename = window.slugify(filename, { remove: /[#&*+~()'"!:@]/g });
      }

      submitBody['filename'] = filename;
      submitBody['filetype'] = file.type;
      submitBody['filesize'] = file.size;
    }
    console.log('auth token', authToken);
    fetch(postFileUrl, {
      method: 'POST',
      body: JSON.stringify(submitBody),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      }
    }).then(resp => resp.json()).then(resp => {
      const { _id, signedPutUrl, signedGetUrl } = resp;
      if (signedPutUrl) {
        file['path'] = file.name;
        fetch(signedPutUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': submitBody.filetype,
            'Content-Length': submitBody.filesize,
            'Content-Disposition': `inline; filename="${submitBody.filename}"`,
          }
        }).then(resp => {
          if (resp) {
            fetch(apiUrl + `/posts/${_id}/submit`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`,
              }
            }).then(resp => {
              console.log('post has been submitted!', resp)
            }).catch(err => {
              console.log('failed PUT on signedPutUrl');
              $('.container').append(uploadAlert);
            });

            $('input[name=myfile]').val('');
            $uploadForm.hide();
            $thankYou.show();
          }
        }).catch(err => {
          console.log('failed PUT on signedPutUrl');
          $('.container').append(uploadAlert);
        });
      } else {
        console.log('no signedPutUrl present');
        $('.container').append(uploadAlert);
      }
    }).catch(err => {
      console.log('failed post upload');
      $('.container').append(uploadAlert);
    });

    return false;
  });

  $("button[name='upload-again']").on("click", function(){
    $thankYou.hide();
    $uploadForm.show();
  });
});
