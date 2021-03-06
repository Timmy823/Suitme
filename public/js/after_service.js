$(document).ready(function(){
  // logout-box click event----------------
  $("div.logout-container div.logout-box").on("click", function(e) {
    e.preventDefault();
    e.stopPropagation();

    $.ajax({
      type: "POST",
      dataType: "json",
      data: {},
      url: '/logout',
      success: function(data) {
        document.location = data.redirectUrl;
      },
      error: function(err) {
        console.log(err);
      }
    });
  });
  
  //evaluation star
  var star = 0;
  $('.star_form>img').on("click",function(event){
    var position = $(this).index();
    for(i = 0; i<= 4; i++){
      if(i <= position) $('.star_form>img').eq(i).attr("src","/img/feedback/white_star.png");
      else $('.star_form>img').eq(i).attr("src","/img/feedback/gray_star.png");
    }
    star = position + 1;
  });

  //select onchange
  $('select[name=shop]').on('change', function(event) {
    if ($(this).val()=='') {
      $(this).next('label').text('請選擇店家');
    } else {
      $(this).next('label').text('');
    }
  });

  //submit question
  $('input[name=question_button]').on("click",function(event){
    var Today=new Date();
    var question = $('textarea[name=question]').val();
    var shop = $('select[name=shop]').val();
    var select_bar = $('select[name=shop]');
    var target = $('textarea[name=question]');
    var is_fault = false;
    console.log(Today);
    var year = Today.getFullYear().toString();
    var month = (Today.getMonth()+1).toString();
    var day = Today.getDate().toString();
    var input_time = year.concat('/',month,'/',day);
    
    if (select_bar.val()=='') {
      select_bar.next('label').text('請選擇店家');
      is_fault |= true;
    } else {
      select_bar.next('label').text('');
    }
    
    if (question.length > 100) {
      target.next('label').text('請輸入100個字以內');
      is_fault |= true;
    } else if (question.length == 0) {
      target.next('label').text('請輸入問題');
      is_fault |= true;
    } else if ( /(\|.*)+/.test(question) ) {
      target.next('label').text('請避免輸入特殊符號"|"');
      is_fault |= true;
    } else {
      target.next('label').text('');
    }

    if (is_fault) {
      return false;
    }

    var _input = {
      ShopName:shop,
      Question:question,
      time:(input_time || '')
    };

    $("input[name=question_button]")
      .prop("disabled", true)
      .val("傳送中");

    $.ajax({
      type:'POST',
      dataType:"json",
      data:_input,
      url:'/afterService',
      success:function(data){
        console.log('send success!');
        $('input[name=question_button]').val('已送出');
        $('input[name=question_button]').css("background","#333333");
        setTimeout(function(){
          $('div#afterservice_succ_pop_up').bPopup({
            modalColor: '#333333',
            opacity: 0.6,
            onClose: ()=>{
              $('input[name=question_button]').val("送出");
              $('input[name=question_button]').css("background","#102633");
              $('textarea[name=question]').val("");
            }
          });
        },500);
      },  
      error:function(data){
        console.log('send error!');
      }
    });
  });

  //submit evaluation
  $('input[name=evaluation_button]').on("click",function(event){
    const Today=new Date();
    const message = $('textarea[name=evaluation]').val();
    const shop = $('select[name=shop]').val();
    let select_bar = $('select[name=shop]');
    let target = $('textarea[name=evaluation]');
    let is_fault = false;                                          
    console.log(Today);
    const year = Today.getFullYear().toString();
    const month = (Today.getMonth()+1).toString();
    const day = Today.getDate().toString();
    const input_time = year.concat('/',month,'/',day);

    if (select_bar.val()=='') {
      select_bar.next('label').text('請選擇店家');
      is_fault |= true;
    } else {
      select_bar.next('label').text('');
    }
    
    if (message.length > 100) {
      target.next('label').text('請輸入100個字以內');
      is_fault |= true;
    } else if (message.length == 0) {
      target.next('label').text('請輸入建議');
      is_fault |= true;
    } else if ( /(\|.*)+/.test(message) ) {
      target.next('label').text('請避免輸入特殊符號"|"');
      is_fault |= true;
    } else {
      target.next('label').text('');
    }

    if (is_fault) {
      return false;
    }
    var _input = {
      ShopName:shop,
      Evaluation:star.toString(),
      time:(input_time || ''),
      Message:message
    };

    $("input[name=evaluation_button]")
      .prop("disabled", true)
      .val("傳送中");

    $.ajax({
      type:'POST',
      dataType:'json',
      data:_input,
      url:'/afterService',
      success:()=>{
        console.log('send success!');
        $('input[name=evaluation_button]').val('已送出');
        $('input[name=evaluation_button]').css("background","#333333");
        setTimeout(function(){
          $('div#afterservice_succ_pop_up').bPopup({
            modalColor: '#333333',
            opacity: 0.6,
            onClose: ()=>{
              $('input[name=evaluation_button]').val("送出");
              $('input[name=evaluation_button]').css("background","#102633");
              $('textarea[name=evaluation]').val("");
              $('.star_form>img').attr("src","/img/feedback/gray_star.png");
            }
          });
        },500);
      },
      error:()=>{
        console.log('send error!');
      }
    });
  });
  return false;
});

function q_textup() {
  //判斷ID為text的文本區域字數是否超過100個
  const target = $('textarea[name=question]'),
    q_str = target.val();

  if (q_str.length > 100) {
    target.next('label').text('請輸入100個字以內');
  } else if (q_str.length == 0) {
    target.next('label').text('請輸入問題');
  } else if ( /(\|.*)+/.test(q_str) ) {
    target.next('label').text('請避免輸入特殊符號"|"');
  } else {
    target.next('label').text('');
  }
}

function e_textup() {
  var target = $('textarea[name=evaluation]'),
    q_str = target.val();

  if (q_str.length > 100) {
    target.next('label').text('請輸入100個字以內');
  } else if (q_str.length == 0) {
    target.next('label').text('請輸入建議');
  } else if ( /(\|.*)+/.test(q_str) ) {
    target.next('label').text('請避免輸入特殊符號"|"');
  } else {
    target.next('label').text('');
  }
}
