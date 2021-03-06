var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

//Creates text area when user clicks on task item, to start the editing process
$(".list-group").on("click", "p", function(){
  var text = $(this)
    .text()
    .trim();
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
    $(this).replaceWith(textInput);
    textInput.trigger("focus");
});

//Function to capture edited text area after user clicks away from text area box
$(".list-group").on("blur", "textarea", function(){
  //Get the textarea's current value/text
  var text = $(this)
    .val()
    .trim();
  
  //Get the parent ul's id attribute
  var status = $(this)
      .closest(".list-group")
      .attr("id")
      .replace("list-", "");

  //Get the task's position in the list of other li elements
  var index = $(this)
  .closest(".list-group-item")
  .index();

  tasks[status][index].text = text;
  saveTasks();

  //Recreates the P element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  //Replace textarea with p element
  $(this).replaceWith(taskP);
});

//Implements JqueryUi datepicker 
$("#modalDueDate").datepicker({
  minDate: 1
});

//Due date was clicked
$(".list-group").on("click", "span", function(){
  //Get current text
  var date = $(this)
    .text()
    .trim();

  //Create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  //Enables jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      $(this).trigger("change");
    }
  });

  //Swap out the elements
  $(this).replaceWith(dateInput);

  //Automatically focus on new element
  dateInput.trigger("focus");
});

//Value of the due date has changed
$(".list-group").on("change", "input[type='text']", function() {
  //Get current text
  var date = $(this)
    .val()
    .trim();

  //Get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  //Get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  //Update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();

  //Recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  //Repace input with span element
  $(this).replaceWith(taskSpan);

  //Pass tasks's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
})

//Logic determining whether a task is overdue or not
var auditTask = function(taskEl) {
  //Get data from taskEl
  var date = $(taskEl).find("span").text().trim();

  var time = moment(date, "L").set("hour", 17);

  //Removes any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-itme-danger");

  //Apply new class if task is near/over due date
  if(moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } 
  else if(Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

//Timer to run auditTask in case user leaves browser open
setInterval(function(){
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  })
}, 1800000);

//Makes all listItemEl sortable, as well as contains the logic to update our local storage arrays
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(this).addClass("dropover-active");
  },
  out: function(event) {
    $(this).removeClass("dropover-active");
  },
  update: function(event) {
    var tempArr = [];

    $(this).children().each(function() {
      var text = $(this)
      .find("p")
      .text()
      .trim();

      var date = $(this)
      .find("span")
      .text()
      .trim()

      tempArr.push({
        text: text,
        date: date
      });
    });

    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

    tasks[arrName] = tempArr;
    saveTasks();
  }
});


//Makes the trash zone droppable and allows it to remove/delete items
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function(event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active")
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();


