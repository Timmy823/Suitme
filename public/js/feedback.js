  $(document).ready(function(){
    var star_total = 0;
    var star_avg = 0;
    var size = $('.comment').size();
    
    for(let i = 0; i<=size-1; i++){
      var temp = $('.comment .star').eq(i).text();
      star_total = star_total + parseInt(temp);
    }
    console.log(star_total);
    
    star_avg = formatFloat(star_total/size,1);
    console.log(star_avg);
    for(let i =0; i <= Math.floor(star_avg)-1; i++){
      $('.star_form img').eq(i).attr("src","/img/feedback/white_star.png");
    }
    if( star_avg - Math.floor(star_avg) >=0.5){
      $('.star_form img').eq(Math.floor(star_avg)).attr("src","/img/feedback/half_star.png");
    }
    $('.evaluation p:nth-child(2)').text((star_avg)+'/5');
      
    
  });
function formatFloat(num, pos)
{
  var size = Math.pow(10, pos);
    return Math.round(num * size) / size;
}