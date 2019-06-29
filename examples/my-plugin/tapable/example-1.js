//let {SyncHook}=require('tapable');
class SyncHook {
  constructor() {
    this.tasks = [];
  }
  tap(name, task) {
    this.tasks.push(task);
  }
  call() {
    this.tasks.forEach(task => task(...arguments));
  }
}

let queue = new SyncHook(['name']);
queue.tap('1', function (name) {
  console.log(name, 1);
});
queue.tap('2', function (name) {
  console.log(name, 2);
});
queue.tap('3', function (name) {
  console.log(name, 3);
});
queue.call('careteen');