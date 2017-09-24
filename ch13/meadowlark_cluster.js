var cluster = require('cluster');

function startWorker() {
    var worker = cluster.fork();
    console.log('CLUSTER: Worker %d started', worker.id);
}

if(cluster.isMaster){

    require('os').cpus().forEach(function(){
	    startWorker();
    });

    // log any workers that disconnect; if a worker disconnects, it
    // should then exit（记录所有断开的工作线程。 如果工作线程断开了， 它应该退出）,
    // so we'll wait for the exit event to spawn a new worker to replace it
    //( 因此我们可以等待 exit 事件然后繁衍一个新工作线程来代替它)
    cluster.on('disconnect', function(worker){
        console.log('CLUSTER: Worker %d disconnected from the cluster.',
            worker.id);
    });

    // when a worker dies (exits), create a worker to replace it
    cluster.on('exit', function(worker, code, signal){
        console.log('CLUSTER: Worker %d died with exit code %d (%s)',
            worker.id, code, signal);
        startWorker();
    });
} else {
    // start our app on worker; see meadowlark.js [在这个工作线程上启动我们的应用服务器]
    //(将它作为一个函数输出并启动服务器)
    require('./meadowlark.js')();

}
