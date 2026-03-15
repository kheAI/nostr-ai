import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './main.html';

Template.leadBoard.onCreated(function() {
  this.leadsData = new ReactiveVar([]);
  this.showOnlySignal = new ReactiveVar(false);

  // Poll the server's in-memory array every 3 seconds
  this.interval = setInterval(async () => {
    try {
      const data = await Meteor.callAsync('getLatestLeads');
      this.leadsData.set(data);
    } catch (err) {
      console.error("Failed to fetch leads", err);
    }
  }, 3000);
});

Template.leadBoard.onDestroyed(function() {
  clearInterval(this.interval);
});

Template.leadBoard.helpers({
  leads() {
    const allLeads = Template.instance().leadsData.get();
    if (Template.instance().showOnlySignal.get()) {
      return allLeads.filter(l => l.isSignal);
    }
    return allLeads;
  },
  isHighConfidence(score) {
    return score >= 80;
  }
});

Template.leadBoard.events({
  'click #filter-toggle'(event, instance) {
    instance.showOnlySignal.set(!instance.showOnlySignal.get());
  }
});