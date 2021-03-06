/*
 *  Copyright 2006 The National Library of New Zealand
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package org.webcurator.ui.groups.controller;

import java.util.List;
import java.util.Iterator;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.ModelAndView;
import org.webcurator.auth.AuthorityManager;
import org.webcurator.core.targets.TargetManager;
import org.webcurator.core.util.CookieUtils;
import org.webcurator.domain.Pagination;
import org.webcurator.domain.model.auth.Privilege;
import org.webcurator.domain.model.core.Target;
import org.webcurator.domain.model.core.TargetGroup;
import org.webcurator.common.ui.Constants;
import org.webcurator.ui.groups.GroupsEditorContext;
import org.webcurator.ui.groups.command.MoveTargetsCommand;
import org.webcurator.ui.groups.validator.MoveTargetsValidator;
import org.webcurator.ui.util.Tab;
import org.webcurator.ui.util.TabbedController.TabbedModelAndView;

/**
 * This controller manages the process of adding members to a Target Group.
 * @author bbeaumont
 */
@Controller
public class MoveTargetsController {
	/** the manager for Target and Group data. */
	@Autowired
	private TargetManager targetManager;
	/** the parent controller for this handler. */
	@Autowired
    @Qualifier("groupsController")
	private TabbedGroupController groupsController;
	/** the manager for checking privleges. */
	@Autowired
	private AuthorityManager authorityManager;
	@Autowired
	private MoveTargetsValidator moveTargetsValidator;

	/** Default COnstructor. */
	public MoveTargetsController() {
	}

	/**
	 * Retrive the editor context for the groups controller.
	 * @param req The HttpServletRequest so the session can be retrieved.
	 * @return The editor context.
	 */
	public GroupsEditorContext getEditorContext(HttpServletRequest req) {
		GroupsEditorContext ctx = (GroupsEditorContext) req.getSession().getAttribute(TabbedGroupController.EDITOR_CONTEXT);
		if( ctx == null) {
			throw new IllegalStateException("tabEditorContext not yet bound to the session");
		}

		return ctx;
	}

	@RequestMapping(path = "/curator/groups/move-targets.html", method = {RequestMethod.POST, RequestMethod.GET})
	protected ModelAndView handle(HttpServletRequest request, HttpServletResponse response, MoveTargetsCommand command,
                                  BindingResult bindingResult) throws Exception {
		//moveTargetsValidator.validate(command, bindingResult);
		GroupsEditorContext ctx = getEditorContext(request);
		if( MoveTargetsCommand.ACTION_MOVE_TARGETS.equals(command.getActionCmd())) {

			TargetGroup sourceGroup = ctx.getTargetGroup();
			List<Long> targetsToMove = ctx.getTargetsToMove();
			TargetGroup targetGroup = null;

			if(command.getParentOids() != null && command.getParentOids().length == 1)
			{
				Long targetGroupOid = command.getParentOids()[0];
				targetGroup = targetManager.loadGroup(targetGroupOid);
				if(targetsToMove != null && targetsToMove.size() > 0 )
				{
					// Perform some validation before allowing the members to be
					// added.
					Iterator<Long> it = targetsToMove.iterator();
					while(it.hasNext()) {
						Long targetToMove = it.next();
						if( targetManager.isDuplicateMember(targetGroup, targetToMove)) {
							// Prevent the addition of duplicate members.
							Target target = targetManager.load(targetToMove, false);
							String name = target.getName();
							bindingResult.reject("groups.bindingResult.duplicate", new Object[] { name }, "Already a member of this group");
						}
					}
				}
			}
			else
			{
				bindingResult.reject("groups.bindingResult.movetargets.must_select", null, "You must select a destination group");
			}

			if(!bindingResult.hasErrors() && targetGroup != null) {

				if(authorityManager.hasPrivilege(sourceGroup, Privilege.ADD_TARGET_TO_GROUP) &&
						authorityManager.hasPrivilege(targetGroup, Privilege.ADD_TARGET_TO_GROUP))
				{
					targetManager.moveTargets(sourceGroup, targetGroup, targetsToMove);
				}

				Tab membersTab = groupsController.getTabConfig().getTabByID("MEMBERS");
				TabbedModelAndView tmav = membersTab.getTabHandler().preProcessNextTab(groupsController, membersTab, request, response, command, bindingResult);
				tmav.getTabStatus().setCurrentTab(membersTab);
				return tmav;
			}
			else
			{
				return doSearch(request, response, command, bindingResult);
			}
		}
		else if( MoveTargetsCommand.ACTION_CANCEL.equals(command.getActionCmd())) {
			// Go back to the Members tab on the groups controller.
			Tab membersTab = groupsController.getTabConfig().getTabByID("MEMBERS");
			TabbedModelAndView tmav = membersTab.getTabHandler().preProcessNextTab(groupsController, membersTab, request, response, command, bindingResult);
			tmav.getTabStatus().setCurrentTab(membersTab);
			return tmav;
		}
		else {
			return doSearch(request, response, command, bindingResult);
		}
	}

	/**
	 * Perform the search for Group members.
	 */
	private ModelAndView doSearch(HttpServletRequest request, HttpServletResponse response, MoveTargetsCommand command,
                                  BindingResult bindingResult) {

		// get value of page size cookie
		String currentPageSize = CookieUtils.getPageSize(request);

		if(command.getSearch() == null) {
			command.setSearch("");
			command.setSelectedPageSize(currentPageSize);
		}

		Pagination results = null;
		if (command.getSelectedPageSize().equals(currentPageSize)) {
			// user has left the page size unchanged..
			results = targetManager.getGroupDTOs(command.getSearch() + "%", command.getPageNumber(), Integer.parseInt(command.getSelectedPageSize()));
		}
		else {
			// user has selected a new page size, so reset to first page..
			results = targetManager.getGroupDTOs(command.getSearch() + "%", 0, Integer.parseInt(command.getSelectedPageSize()));
			// ..then update the page size cookie
			CookieUtils.setPageSize(response, command.getSelectedPageSize());
		}

		ModelAndView mav = new ModelAndView("group-move-targets");
		mav.addObject("page", results);
		mav.addObject(Constants.GBL_CMD_DATA, command);
		if(bindingResult.hasErrors()) { mav.addObject(Constants.GBL_ERRORS, bindingResult); }
		return mav;
	}


	/**
	 * @param groupsController The groupsController to set.
	 */
	public void setGroupsController(TabbedGroupController groupsController) {
		this.groupsController = groupsController;
	}


	/**
	 * @param targetManager The targetManager to set.
	 */
	public void setTargetManager(TargetManager targetManager) {
		this.targetManager = targetManager;
	}


	/**
	 * @param authorityManager The authorityManager to set.
	 */
	public void setAuthorityManager(AuthorityManager authorityManager) {
		this.authorityManager = authorityManager;
	}
}
