$(function(){

  register();
  callValidate();
  function register() {
    $.validator.addMethod("phoneNum", function(value, element) {
      return this.optional(element) || /^\d{4}-\d{3}-\d{3}$/.test(value);
    }, 'Please enter valid phone number');
  }
  function callValidate() {
    console.log('validating');
    $('form#book_form').validate({
      debug: true,
      submitHandler: myhander,
      rules: {
        shop: {
          required: true
        },
        types: {
          required: true
        },
        cloth: {
          required: true
        },
        phone: {
          required: true,
          phoneNum: true
        }
      },
      messages: {
        shop: {
          required: '*請選擇店家'
        },
        types: {
          required: '*請選擇種類'
        },
        cloth: {
          required: '*請選擇布料'
        },
        phone: {
          required: '*請輸入電話號碼，如：0999-111-111',
          phoneNum: '*請輸入電話號碼，如：0999-111-111'
        }
      },
      showErrors: function(errorMap, errorList) {
        $(errorList).each(function() {
          $(this.element)
            .next('div.error-box')
            .find('label')
            .text(this.message);
        });

        this.defaultShowErrors();
      },
      errorPlacement: function(error, element) {
        return true;
      },
      highlight: function(element, errorClass) {
        $(element).addClass('error-input')
          .next('div.error-box')
          .find('label')
          .css({color:'rgba(0,51,51,1)'});
      },
      unhighlight: (element, errorClass)=>{
        $(element).removeClass('error-input')
          .next('div.error-box')
          .find('label')
          .css({color:''});
      }
    });
  }

  function myhander(form) {
    $("input[type=submit]")
      .prop("disabled", true)
      .val("傳送中").animate({
        textIndex: 60
      },{
        duration: 810,
        step: function(now, fx) {
          $(this).css({
            'background': ('linear-gradient(90deg, rgba(0, 51, 51, 1) 0%, rgba(0, 51, 51, 1) '+now+'%, rgba(0, 51, 51, 0.5) '+now+'%, rgba(0,51, 51, 0.5) 100%)')
          });
        }
      }
    );

    // collect input data under form dom
    var serialData = $(form).serializeObject();
    var _sendData = {
      shop: (serialData.shop || ''),
      types: (serialData.types || ''),
      cloth: (serialData.cloth || '')
    };
    $.ajax({
      type: "POST",
      dataType: "json",
      data: _sendData,
      url:  '/bookHome',
      success: () => {
        $('input[type=submit]').animate({
          textIndex: 100
        },{
          duration: 540,
          step: function(now, fx) {
            $(this).css({
              'background': ('linear-gradient(90deg, rgba(0, 51, 51, 1) 0%, rgba(0, 51, 51, 1) '+now+'%, rgba(0, 51, 51, 0.5) '+now+'%, rgba(0,51, 51, 0.5) 100%)')
            });
          },
          complete: ()=>{
            $("input[type=submit]").val("送出成功");
          }
        });
      },
      error: ()=>{
        console.log("error");
      }
    });
    return false;
  }

});

$(document).ready(()=>{
  // logout-box click event----------------
  $("div.logout-container div.logout-box").on("click", function(e) {
    console.log("logout");
    e.preventDefault();
    e.stopPropagation();
                     
    $.ajax({
      type: "POST",
      dataType: "json",
      data: {},
      url: '/logout',
      success: (data)=> {
        document.location = data.redirectUrl;
      },
      error: (err)=>{
        console.log(err);
      }
    });
  });

  // render book time by ajax data--------------
  $("select[name=shop]").change(function(){
    $(this).find('option').eq(0).attr("disabled","disabled");
    let _send = {
      shop_id: $(this).val()
    };

    $.ajax({
      type: "GET",
      dataType: "json",
      data: _send,
      url: '/bookHome',
      success: (data)=>{
        console.log(data);
        var option_type = data.reply[0].map((e)=>{
          return $("<option value='"+e+"'>"+e+"</option>");
        });
        var option_cloth = data.reply[1].map((e,index)=>{
          return $("<option value='"+e+"'>"+(index+1)+"</option>");
        });

        $("select[name=types] option:not([value=''])").remove("option");
        $("select[name=types]").append(option_type);
        $("select[name=types] option[value='']").attr("disabled","disabled");


        $("select[name=cloth] option:not([value=''])").remove("option");
        $("select[name=cloth]").append(option_cloth);
        $("select[name=cloth] option[value='']").attr("disabled","disabled");
        
      },
      error: (error)=>{
        console.log(error);
      }
    });
  });
});
$(document).ready(()=>{
  // $('.book-circular > img').hover(()=>{
  //   $('.book-circular > input').css("display","");
  // });
    $('.book-circular > input').change(function(e){
      console.log("click");
      console.log(e.target);
      let image = e.target.files[0];
      let filename = $('.name-box').find('h2').text() + "." + (image.name).split(".")[1];
      const formdata = new FormData();
      formdata.append('file', image, filename);
  
      $.ajax({
        type: 'PUT',
        processData: false,
        contentType: false,
        data: formdata,
        url: '/bookHome',
        success: (data)=>{
          console.log("photo update");
          $('div#photo_succ_pop_up').bPopup({
            modalColor: '#333333',
            opacity: 0.6,
            onClose: function(){
              document.location = data.redirectUrl;
            }
          });
        },
        error: (error)=>{
          console.log(error);
        }
      });
    });
 

});
