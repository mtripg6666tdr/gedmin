#!/usr/bin/env node
// @ts-check

const program = require("commander").program;
program
  .usage("-t Your token -g id -u id [options]")
  .description("You may be able to grant administrator privileges to a account you'd like to.")
  .version(require("../package.json").version)
  .option("-u, --userid <uid>", "A discord account id you want to grant administrator privileges to")
  .option("-g, --guildid <gid>", "A target discord server id")
  .option("-t, --token <token>", "token in a process of granting")
  .option("-c, --forcenew", "Force creating new role")
  .option("-n, --name <name>", "The name of a role the bot creates newly")
  .showHelpAfterError()
  .parse(process.argv);

const opts = program.opts();
if(!opts.userid || !opts.token || !opts.guildid) {
  console.log("An user id, guild id and toke are required.");
  program.help();
}else{
  const discord = require("discord.js");
  const client = new discord.Client();
  client.on("ready", ()=>{
    client.guilds.fetch(opts.guildid).then(guild => {
      if(guild.member(client.user.id).hasPermission("ADMINISTRATOR")){
        guild.roles.fetch().then(({cache}) => {
          const rawroles = cache.filter((value, key) => value.editable && value.permissions.has("ADMINISTRATOR"));
          if(rawroles.size >= 1 && !opts.forcenew){
            const role = rawroles.array().reduce((a,b)=>{
              if(a.position > b.position) return a;
              else return b;
            });
            guild.members.fetch(opts.userid).then(member => {
              member.roles.add(role).then(()=>{
                console.log("Successfully granted the administrator privileges named: " + role.name);
                client.destroy();
                process.exit(0);
              }).catch(e => {
                console.error("Some error occurred while adding the role: " + e);
                client.destroy();
                process.exit(1);
              });
            }).catch(e => {
              console.error("Some error occurred while fetching the specified user in the specified server: " + e);
              client.destroy();
              process.exit(1);
            });
          }else{
            guild.roles.create({
              data: {
                name: opts.name ?? "new role",  
                hoist: false,
                permissions: "ADMINISTRATOR"
              }
            }).then((role)=>{
              role.setPosition(guild.me.roles.highest.position - 1)
              guild.members.fetch(opts.userid).then(member => {
                member.roles.add(role).then(()=>{
                  console.log("Successfully granted the administrator privileges named: " + role.name);
                  client.destroy();
                  process.exit(0);
                }).catch(e => {
                  console.error("Some error occurred while adding the role: " + e);
                  client.destroy();
                  process.exit(1);
                })
              }).catch(e => {
                console.error("Some error occurred while fetching the specified user in the specified server:" + e);
                client.destroy();
                process.exit(1);
              })
            }).catch(e => {
              console.error("Some error occurred while creating a new role" + e);
              client.destroy();
              process.exit(1);
            })
          }
        }).catch(e=>{
          console.error("Some error occurred while fetching the specified server's roles");
          client.destroy();
          process.exit(1);
        })
      }else{
        console.error("The bot does not have enough permission in this server");
      }
    }).catch(e => {
      console.error("Some error occurred while fetching the specified server: " + e);
    })
  });
  client.login(opts.token);
}