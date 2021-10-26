#!/usr/bin/env node

const fs = require("fs");
var argv = require("minimist")(process.argv.slice(2));
/* 
-c to take commandWithVerb aggregateType-Verb-Extra
--server to decide server side command or not 
--saga to work on saga
Example:  node . -c Board-Add-BoardMember
*/

if (!Boolean(argv.saga)) {
  //#region Command/Event

  var pathToCommandsFiles = "./";
  var pathToEventsFiles = "./";
  var pathToCommandHandlerFiles = "./";

  var exceptions = {
    are: "were",
    eat: "ate",
    go: "went",
    have: "had",
    inherit: "inherited",
    is: "was",
    run: "ran",
    sit: "sat",
    visit: "visited",
  };

  var commandWithVerb = argv.c; // like Board-Add-BoardMember
  var isServerSide = Boolean(argv.server);
  commandWithVerbSlices = commandWithVerb.split("-");
  aggregateName = commandWithVerbSlices[0];
  verb = commandWithVerbSlices[1];
  rest = commandWithVerbSlices[2];
  commandFileName = `${aggregateName}${verb}${rest}Command`;
  eventFileName = `${aggregateName}${rest}${getPastTense(verb)}Event`;
  commandHandlerFileName = commandFileName + "Handler";

  createCommandFile(commandFileName);
  createCommandHandlerFile(commandHandlerFileName, commandFileName);
  createEventFile(eventFileName);

  // grammatically predictable rules
  function getPastTense(verb) {
    if (exceptions[verb.toLowerCase()]) {
      return exceptions[verb];
    }
    if (/e$/i.test(verb)) {
      return verb + "d";
    }
    if (/[aeiou]c/i.test(verb)) {
      return verb + "ked";
    }
    // for american english only
    if (/el$/i.test(verb)) {
      return verb + "ed";
    }
    if (/[aeio][aeiou][dlmnprst]$/.test(verb)) {
      return verb + "ed";
    }
    if (/[aeiou][bdglmnprst]$/i.test(verb)) {
      return verb.replace(/(.+[aeiou])([bdglmnprst])/, "$1$2$2ed");
    }
    return verb + "ed";
  }

  function createEventFile(filename) {
    var eventName = `${aggregateName}${rest}${getPastTense(verb)}`;
    var eventTemplate = `
using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace Statsh.Domain.TT.Events
{
    [EventVersion("${eventName}", 1)]
    public class ${filename} : IAggregateEvent<${aggregateName}Aggregate, ${aggregateName}Ref>
    {
        
    }
}
  
`;
    var eventFileNameWithPath = `${pathToEventsFiles}${eventFileName}.cs`;
    createFile(eventFileNameWithPath, eventTemplate);
  }

  function createCommandFile(filename) {
    var commandTemplate;
    if (isServerSide) {
      commandTemplate = `
using EventFlow.Aggregates;
using Statsh.Attributes;
using Statsh.EventFlow.Commands;

namespace Statsh.Domain.TT.Commands
{
    public class ${filename} : ServerSideCommand<${aggregateName}Aggregate, ${aggregateName}Ref>
    {
        public ${filename}(${aggregateName}Ref id, IEventId sourceEvent)
            : base(id, sourceEvent)
        {
        }
        
    }
}
    `;
    } else {
      commandTemplate = `
using Statsh.Attributes;
using Statsh.EventFlow.Commands;

namespace Statsh.Domain.TT.Commands
{
    public class ${filename} : ClientSideCommand<${aggregateName}Aggregate, ${aggregateName}Ref>
    {
        public ${filename}(${aggregateName}Ref id, ClientSideCommandRef? commandId): base(id, commandId)
        {
        }
        
    }
}
    `;
    }
    var commandFileNameWithPath = `${pathToCommandsFiles}${commandFileName}.cs`;
    createFile(commandFileNameWithPath, commandTemplate);
  }

  function createCommandHandlerFile(filename, commandFileName) {
    var aggregateAction = `${verb}${rest}`;
    var commandHandlerTemplate = `
using EventFlow.Commands;
using Statsh.Domain.${aggregateName}.Commands;
using Statsh.EventFlow.Commands;
using System.Threading;
using System.Threading.Tasks;

namespace Statsh.Domain.TT.CommandHandlers
{
    public sealed class ${filename} : CommandHandler<${aggregateName}Aggregate, ${aggregateName}Ref, CommandExecutionResult, ${commandFileName}>
    {
        public override Task<CommandExecutionResult> ExecuteCommandAsync(
            ${aggregateName}Aggregate aggregate,
            ${commandFileName} command,
            CancellationToken cancellationToken)
        {
            var executionResult = aggregate.${aggregateAction}(command);
            return executionResult;
        }
    }
}
    
`;
    var commandHandlerWithPath = `${pathToCommandHandlerFiles}${filename}.cs`;
    createFile(commandHandlerWithPath, commandHandlerTemplate);
  }

  //#endregion
} else {
  //#region SAGA
  var path = "./";
  var sagaName = argv.saga;
  function createSagaFile(filename) {
    var Template = `using EventFlow.Aggregates;
    using EventFlow.Sagas;
    using EventFlow.Sagas.AggregateSagas;
    using Statsh.Domain.Tenant;
    using Statsh.Domain.Tenant.Commands;
    using Statsh.Domain.Tenant.Events;
    using Statsh.Domain.User;
    using Statsh.Domain.User.Commands;
    using Statsh.Domain.User.Events;
    using Statsh.Domain.WorkspaceCreatedSaga.Events;
    using System.Threading;
    using System.Threading.Tasks;
    
    namespace Statsh.Domain.WorkspaceCreatedSaga
    {
        public sealed class WorkspaceCreatedSaga :
            AggregateSaga<WorkspaceCreatedSaga, WorkspaceCreatedSagaId, WorkspaceCreatedSagaLocator>,
            ISagaIsStartedBy<WorkspaceAggregate, WorkspaceRef, WorkspaceCreatedEvent>,
            ISagaHandles<...Aggregate, ...Ref, ...Event>,
        {
            public WorkspaceCreatedSaga(WorkspaceCreatedSagaId id)
                : base(id)
            {
                state = new WorkspaceCreatedSagaState();
                Register(state);
            }
    
            readonly WorkspaceCreatedSagaState state;
    
    
        }
    }
    `;
    var fileWithPath = `${pathToCommandHandlerFiles}${filename}.cs`;
    createFile(fileWithPath, Template);
  }
  //#endregion
}

function createFile(filename, content) {
  fs.writeFile(filename, content, function (err) {
    if (err) throw err;
    console.log(`File ${filename} is created successfully.`);
  });
}
