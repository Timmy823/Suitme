$(document).ready( function() {

  /* customized valiated method */
  $.validator.addMethod("phoneNum", function(value, element) {
    console.log(this);
    return this.optional(element) || /^\d{4}-\d{3}-\d{3}$/.test(value);
  }, 'Please enter valid phone number');

  $.validator.addMethod('enUsername', function(value, element) {
    return this.optional(element) || /^(?=.{8,16})(?![_.-])(?!.*[_.-]{2})[a-zA-Z0-9._-]+(?:[^_.-])$/.test(value);
  }, '6 to 16 with a-zA-Z._- character');

  $.validator.addMethod('cjkenUsername', function(value, element) {
    return this.optional(element) || /^(?=.{2,16})(?![_.-])(?!.*[_.-]{2})[a-zA-Z0-9\u4e00-\u9fff._-]+(?:[^_.-])$/.test(value);
  }, '2 to 16 chinese, japen, korean, and en character');

  $.validator.addMethod('password', function(value, element) {
    return this.optional(element) || /^(?=(?:.*[a-zA-Z]){2})(?=.*\d)[a-zA-Z0-9]{6,16}$/.test(value);
  }, 'at least 2 char, and total 8 to 16 char and num');
  
  $.validator.addMethod('trimail', function(value, element) {
    return this.optional(element) || /^((?:^\w+(?:[-+.']\w+)*@(?:gmail\.com|yahoo\.com|hotmail\.com)))$/.test(value);
  }, 'gmail.com or yahoo.com or hotmail.com');
  /*------------------------------*/

  $("form#register-form").validate({
    debug: true,
    submitHandler: function(form) {

      var sendData = $("form#register-form").serializeObject();
      delete sendData.password2;
      //for (var key in sendData) sendData[key] = "a" + sendData[key];

      console.log("start submit");

      /* disable orgin event behavior */
      $.ajax({
        type: "POST" ,
        dataType: "json",
        data: sendData,
        url: '/register',
        success: function(data) {

          if (!data.accountDup) {

            console.log(data.accountDup);
           
            // if register successful , show popup info
            //  redirect url after close popup
            $('div#register_succ_pop_up').bPopup({
              modalColor: '#333333',
              opacity: 0.6,
              onClose: function(){
                document.location = data.redirectUrl;
              }
            });

          } else {

            $("input[name=account]")
              .addClass("error-input")
                .next("label.myerror")
                .text("*?????????????????????")
                .removeClass("label-hide");

          }            
        },
        error: function(error) {
          console.log("fail");
        }
      });

      return false;
      
    },
    rules: {
      account: {
        required: true,
        enUsername: true
      },
      nickname: {
        required: true,
        cjkenUsername: true
      },
      password: {
        required: true,
        password: true
      },
      password2: {
        required: true,
        equalTo: "#password",
        password: false
      },
      cellphone: {
        required:true,
        phoneNum: true
      },
      email: {
        required: true,
        trimail: true
      }
    },
    messages: {
      account: {
        required: "*8???16?????????.-_????????????",
        enUsername: "*8???16?????????.-_????????????"
      },
      nickname: {
        required: "*2???16???????????????.-_???????????????",
        cjkenUsername: "*2???16???????????????.-_???????????????"
      },
      password: {
        required: "*6???16?????????????????????????????????2??????",
        password: "*6???16?????????????????????????????????2??????"
      },
      password2: {
        required: "*??????????????????",
        equalTo: "*??????????????????"
      },
      cellphone: {
        required: "*????????????????????????0999-111-111",
        phoneNum: "*????????????????????????0999-111-111"
      },
      email: {
        required: "*gmail, yahoomail, hotmail ??????",
        trimail: "*gmail, yahoomail, hotmail ??????"
      }
    },
    showErrors: function(errorMap, errorList) {
      console.log(errorMap);
      console.log($(errorList).each(function(){ console.log(this);}));
      $(errorList).each(function(){
        $(this.element).next(".myerror").text(this.message);
      });
      
      this.defaultShowErrors();
    },
    errorPlacement: function(error, element) {
      return true;
    },
    highlight: function(element, errorClass) {
      $(element).addClass("error-input")
        .next('label.myerror').css({color:'rgba(0,51,51,1)'});
    },
    unhighlight: function(element, errorClass) {
      $(element).removeClass("error-input")
        .next('label.myerror').css({color:''});
    }
  });
});
