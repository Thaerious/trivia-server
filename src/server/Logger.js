
class Channel{
      constructor(){
            this._enabled = true;
            this._prefix = ()=>{return ""}
      }

      get enabled(){
            return this._enabled;
      }

      set enabled(value){
            this._enabled = value;
      }

      get prefix(){
            return this._prefix;
      }

      /**
       * The prefix can be a string or a function.
       * If it's a function then if it has parameters Logger will pass in the filename, 
       * line number, and line offset.
       * These require extra processing so it is only done if parameters are present.
       */
      set prefix(value){
            if (typeof value === "function"){
                  this._prefix = value;
            } else {
                  this._prefix = ()=>{return value};                  
            }
      }

      log(string){
            if (this.enabled) console.log(this.process(string));
      }

      trace(string){
            if (this.enabled) console.trace(this.process(string));
      }

      error(string){
            if (this.enabled) console.error(this.process(string));
      }      

      warn(string){
            if (this.enabled) console.warn(this.process(string));
      }         

      process(string){
            if (this._prefix.length > 0){
                  const stack = new Error().stack.split("\n");
                  const parsed = /\/([^/:]+):(\d+):(\d+)/.exec(stack[Logger.traceOffset]);
                  return this._prefix(parsed[1], parsed[2], parsed[3]) + string;
            } else {
                  return this._prefix() + string;
            }
      }
}

class Logger{
      constructor(){
            this.channels = {
                  "log" : new Channel()
            }

            this.last = this.channels["log"];
      }

      channel(name){
            name = name ?? "log";
            if (!this.channels[name]) this.channels[name] = new Channel();
            this.last = this.channels[name];
            return this.channels[name];
      }

      log(string){
            this.last.log(string);
      }

      trace(string){
            this.last.trace(string);
      }

      error(string){
            this.last.error(string);
      }      

      warn(string){
            this.last.warn(string);
      }     
}

Logger.traceOffset = 4;

export default Logger;