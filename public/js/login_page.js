$(document).ready( function() {
  $("form#login_form").validate({
    debug: true,
    submitHandler: function(form) {

      const sendData = $("form#login_form").serializeObject();
      //for (var key in sendData) sendData[key] = "a" + sendData[key];

      console.log("start submit");

      /* disable orgin event behavior */
      $.ajax({
        type: "POST" ,
        dataType: "json",
        data: sendData,
        url: '/login',
        success: (data) => {
          console.log(data);

          if (data.succLogin) {
            document.location = data.redirectUrl;
            console.log(data.succLogin);
          } else {
            console.log(data.succLogin);

            $('div#login_false_pop_up').bPopup({
              modalColor: '#333333',
              opacity: 0.6
            });
            $("input[name=account]").val("");
            $("input[name=password]").val("");
          }
        },
        error: () => {
          console.log("fail");
        }
      });

      return false;
      
    },
    rules: {
      account: {
        required: true
      },
      password: {
        required: true
      }
    },
    messages: {
      account: {
        required: "*請輸入帳號"
      },
      password: {
        required: "*請輸入密碼"
      }
    },
    showErrors: function(errorMap, errorList){
      console.log(errorMap);
      console.log($(errorList).each(function(){ console.log(this);}));
      $(errorList).each(function(){
        $(this.element).next(".myerror").text(this.message);
      });
      
      this.defaultShowErrors();
    },
    errorPlacement: () =>{
      return true;
    },
    highlight: function(element, errorClass) {
      $(element).addClass("error-input");
      $(element).next(".myerror").removeClass("label-hide");
    },
    unhighlight: function(element, errorClass) {
      $(element).removeClass("error-input");
      $(element).next(".myerror").addClass("label-hide");
    }
  });
  $('#nav-bar a').on("click",function(event){
    var choice_pick = $(this).text();
    console.log(choice_pick);
    if((typeof choice_pick === 'string')&&(choice_pick == '製作過程')){
      choice = 'process';
    }
    else if ((typeof choice_pick === 'string')&&(choice_pick == '售後服務')) {
      choice = 'service';
    }
    else {
      choice = 'process';
    }
    console.log(choice);
    $.ajax({
      type:'POST',
      dataType:'json',
      data: {
        Choice:choice
      },
      url:'/login/',
        success: ()=>{
        console.log('send success!');
      },
      error:()=>{
        console.log('send error!');
      }
    });
  });

});
