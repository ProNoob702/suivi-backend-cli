#!/usr/bin/env node

const fs = require("fs");
var argv = require("minimist")(process.argv.slice(2));
/* 
-c to take commandWithVerb aggregateType-Verb-Extra
--server to decide server side command or not 
--saga to work on saga
Example Command:  
  node . -c Board-Add-BoardMember
Example Saga: 
  node . --saga Board-Deleted-Saga
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
  var sagaPath = "./";
  var sagaSlices = argv.saga.split("-");
  var sagaName = sagaSlices.join("");
  var aggregate = sagaSlices[0];
  var sagaStartingEvent = sagaSlices[0] + sagaSlices[1];

  createSagaFile();
  createSagaIdFile(sagaName + "Id");
  createSagaLocatorFile(sagaName + "Locator");
  createSagaStateFile(sagaName + "State");
  createStartEventFile(sagaName + "StartedEvent");

  function createSagaFile() {
    var Template = `
using EventFlow.Aggregates;
using EventFlow.Sagas;
using EventFlow.Sagas.AggregateSagas;
using Statsh.Domain.${sagaName}.Events;
using System.Threading;
using System.Threading.Tasks;

namespace Statsh.Domain.${sagaName}
{
    public sealed class ${sagaName} :
        AggregateSaga<${sagaName}, ${sagaName}Id, ${sagaName}Locator>,
        ISagaIsStartedBy<${aggregate}Aggregate, ${aggregate}Ref, ${sagaStartingEvent}Event>
        // ISagaHandles<...Aggregate, ...Ref, ...Event>
    {
        public ${sagaName}(${sagaName}Id id)
            : base(id)
        {
            state = new ${sagaName}State();
            Register(state);
        }

        readonly ${sagaName}State state;

        public Task HandleAsync(IDomainEvent<${aggregate}Aggregate, ${aggregate}Ref, ${sagaStartingEvent}Event> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
        {
          Emit(new ${sagaName}StartedEvent()
          {
             ...
          });  
          return Task.CompletedTask;
        }

    }
}
    `;
    var fileWithPath = `${sagaPath}${sagaName}.cs`;
    createFile(fileWithPath, Template);
  }

  function createSagaIdFile(filename) {
    var Template = `
using EventFlow.Aggregates;
using EventFlow.Sagas;
using EventFlow.ValueObjects;
using System;

namespace Statsh.Domain.${sagaName}
{
    public sealed class ${sagaName}Id : SingleValueObject<string>, ISagaId
    {
        public static ${sagaName}Id Create(IDomainEvent domainEvent)
        {
            if (domainEvent.IdentityType == typeof(${aggregate}Ref))
            {
                return new ${sagaName}Id(new ${aggregate}Ref(domainEvent.Metadata.AggregateId));
            }
            if (domainEvent.GetAggregateEvent() is ... ...)
            {
                return new ${sagaName}Id(....ref);
            }
            throw new ArgumentException();
        }

        public ${sagaName}Id(string sagaId)
            : base(sagaId)
        {
        }

        private ${sagaName}Id(${aggregate}Ref Id)
            : base($"${sagaName}-{Id.Value}")
        {
        }
    }
}
    `;
    var fileWithPath = `${sagaPath}${filename}.cs`;
    createFile(fileWithPath, Template);
  }

  function createSagaLocatorFile(filename) {
    var Template = `
using EventFlow.Aggregates;
using EventFlow.Sagas;
using System.Threading;
using System.Threading.Tasks;

namespace Statsh.Domain.${sagaName}
{
    public sealed class ${sagaName}Locator : ISagaLocator
    {
        public Task<ISagaId> LocateSagaAsync(
          IDomainEvent domainEvent,
          CancellationToken cancellationToken)
        {
            var sagaId = ${sagaName}Id.Create(domainEvent);
            return Task.FromResult<ISagaId>(sagaId);
        }
    }
}
    `;
    var fileWithPath = `${sagaPath}${filename}.cs`;
    createFile(fileWithPath, Template);
  }

  function createSagaStateFile(filename) {
    var Template = `
using EventFlow.Aggregates;
using Statsh.Domain.${sagaName}.Events;
using System.Collections.Generic;

namespace Statsh.Domain.${sagaName}
{
    sealed class ${sagaName}State :
        AggregateState<${sagaName}, ${sagaName}Id, ${sagaName}State>,
        IEmit<${sagaName}StartedEvent>
    {

        // private HashSet<UserRef> Users;
        // public bool BoardImageFileUpdated { get; private set; } = false;

        public bool AllIsOk()
        {
            return ...;
        }

        public void Apply(${sagaName}StartedEvent aggregateEvent)
        {
          ...
        }
       
    }
}
    
    `;
    var fileWithPath = `${sagaPath}${filename}.cs`;
    createFile(fileWithPath, Template);
  }

  function createStartEventFile(filename) {
    var Template = `
using EventFlow.Aggregates;
using EventFlow.EventStores;
using System.Collections.Generic;

namespace Statsh.Domain.${sagaName}.Events
{
    [EventVersion("${sagaName}Started", 1)]
    public class ${sagaName}StartedEvent : IAggregateEvent<${sagaName}, ${sagaName}Id>
    {
        
    }
}  
    `;
    var fileWithPath = `${sagaPath}${filename}.cs`;
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
